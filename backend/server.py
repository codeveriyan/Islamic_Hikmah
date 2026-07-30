from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorClient
import base64
import binascii
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field
from typing import Any, Dict, Literal, Optional
from datetime import datetime, timedelta, timezone
import jwt
import re
import requests
from cryptography import x509
from pymongo.errors import DuplicateKeyError
from learn_quran.router import create_learn_quran_router
from learn_quran.asr import (
    AsrTranscriptionError,
    AsrUnavailableError,
    NoArabicSpeechError,
    get_quran_asr_service,
)
from quran_corpus import CorpusUnavailableError
from quran_identify_matcher import NoConfidentMatchError, identify_from_transcript, find_best_match

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'islamic_hikmah')
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
db = client[db_name]

# The in-memory store is an explicit local-development option only. Production
# requests fail closed when MongoDB is unavailable.
ALLOW_IN_MEMORY_DB = os.environ.get("ALLOW_IN_MEMORY_DB", "false").lower() == "true"
IN_MEMORY_DB = {
    "users": {},
    "payments": {},
}

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "islamic-hikmah")
APP_ENV = os.environ.get("APP_ENV", "production").lower()
DEV_PREMIUM_EMAILS = {
    email.strip().lower()
    for email in os.environ.get("DEV_PREMIUM_EMAILS", "").split(",")
    if email.strip()
}
DEFAULT_CORS_ORIGINS = "http://localhost:8080,http://localhost:8081,http://localhost:19006"
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]
if "*" in CORS_ORIGINS:
    raise RuntimeError("CORS_ORIGINS must be an explicit allowlist; wildcard origins are not allowed.")


def apply_development_entitlements(user: dict) -> dict:
    if APP_ENV == "development" and user.get("email", "").lower() in DEV_PREMIUM_EMAILS:
        development_user = user.copy()
        development_user["tier"] = "premium"
        development_user["_development_entitlement"] = True
        return development_user
    return user

# Pydantic Schemas
class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    profile_image: Optional[str] = Field(default=None, max_length=2048)

class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    profile_image: Optional[str] = None
    provider: str
    provider_id: Optional[str] = None
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: datetime
    status: str
    tier: str = "free"
    trial_started_at: Optional[datetime] = None
    trial_active: bool = False
    trial_ends_at: Optional[datetime] = None

# Database check & query helpers
def _use_development_memory_store() -> bool:
    """Skip MongoDB entirely only when the local-development fallback is explicit."""

    return APP_ENV == "development" and ALLOW_IN_MEMORY_DB


def _database_unavailable(operation: str, error: Exception) -> None:
    if ALLOW_IN_MEMORY_DB:
        logger.warning(
            "MongoDB %s failed; using the explicitly enabled in-memory development store. Error: %s",
            operation,
            error,
        )
        return
    logger.error("MongoDB %s failed. Error: %s", operation, error)
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="The service database is temporarily unavailable.",
    )


async def db_find_user_by_email(email: str):
    normalized_email = email.lower()
    if _use_development_memory_store():
        return IN_MEMORY_DB["users"].get(normalized_email)
    try:
        user = await db.users.find_one({"email": normalized_email})
        return user
    except Exception as e:
        _database_unavailable("user lookup", e)
        return IN_MEMORY_DB["users"].get(normalized_email)

async def db_insert_user(user_dict: dict):
    if _use_development_memory_store():
        IN_MEMORY_DB["users"][user_dict["email"].lower()] = user_dict
        return
    try:
        await db.users.insert_one(user_dict)
    except Exception as e:
        _database_unavailable("user insert", e)
        IN_MEMORY_DB["users"][user_dict["email"].lower()] = user_dict

async def db_update_user(email: str, update_dict: dict):
    if _use_development_memory_store():
        user = IN_MEMORY_DB["users"].get(email.lower())
        if user:
            user.update(update_dict)
        return
    try:
        await db.users.update_one({"email": email.lower()}, {"$set": update_dict})
    except Exception as e:
        _database_unavailable("user update", e)
        user = IN_MEMORY_DB["users"].get(email.lower())
        if user:
            user.update(update_dict)


async def db_find_payment_by_utr(utr: str):
    if _use_development_memory_store():
        return IN_MEMORY_DB["payments"].get(utr)
    try:
        return await db.payments.find_one({"_id": utr})
    except Exception as e:
        _database_unavailable("payment lookup", e)
        return IN_MEMORY_DB["payments"].get(utr)


async def db_insert_payment(payment_dict: dict):
    if _use_development_memory_store():
        utr = payment_dict["_id"]
        if utr in IN_MEMORY_DB["payments"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This UTR has already been submitted.",
            )
        IN_MEMORY_DB["payments"][utr] = payment_dict
        return
    try:
        await db.payments.insert_one(payment_dict)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This UTR has already been submitted.",
        )
    except Exception as e:
        _database_unavailable("payment insert", e)
        utr = payment_dict["_id"]
        if utr in IN_MEMORY_DB["payments"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This UTR has already been submitted.",
            )
        IN_MEMORY_DB["payments"][utr] = payment_dict

# Cache of Google public certificates for Firebase ID Token verification.
# Persisting these public certificates lets a restarted local backend verify
# tokens during a transient network outage without weakening signature checks.
GOOGLE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)
FIREBASE_CERT_CACHE_PATH = Path(
    os.environ.get(
        "FIREBASE_CERT_CACHE_PATH",
        ROOT_DIR / "data" / "firebase_public_certs_cache.json",
    )
)
GOOGLE_CERTS: dict[str, str] = {}
GOOGLE_CERTS_EXPIRE = datetime.min.replace(tzinfo=timezone.utc)


def _certificate_is_current(certificate_pem: str, now: datetime) -> bool:
    try:
        certificate = x509.load_pem_x509_certificate(certificate_pem.encode("utf-8"))
        return certificate.not_valid_before_utc <= now <= certificate.not_valid_after_utc
    except (TypeError, ValueError):
        return False


def _validated_google_certificates(value: Any, now: datetime) -> dict[str, str]:
    if not isinstance(value, dict):
        return {}
    return {
        kid: certificate
        for kid, certificate in value.items()
        if isinstance(kid, str)
        and isinstance(certificate, str)
        and _certificate_is_current(certificate, now)
    }


def _load_google_certificate_cache(now: datetime) -> None:
    global GOOGLE_CERTS, GOOGLE_CERTS_EXPIRE
    if not FIREBASE_CERT_CACHE_PATH.is_file():
        return
    try:
        payload = json.loads(FIREBASE_CERT_CACHE_PATH.read_text(encoding="utf-8"))
        certificates = _validated_google_certificates(payload.get("certificates"), now)
        expires_at = datetime.fromisoformat(payload["expiresAt"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if certificates:
            GOOGLE_CERTS = certificates
            GOOGLE_CERTS_EXPIRE = expires_at
    except (OSError, ValueError, TypeError, KeyError, json.JSONDecodeError) as exc:
        logger.warning("Ignoring an invalid Firebase certificate cache: %s", exc)


def _save_google_certificate_cache(
    certificates: dict[str, str],
    expires_at: datetime,
) -> None:
    try:
        FIREBASE_CERT_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        temporary_path = FIREBASE_CERT_CACHE_PATH.with_suffix(".tmp")
        temporary_path.write_text(
            json.dumps(
                {
                    "expiresAt": expires_at.isoformat(),
                    "certificates": certificates,
                }
            ),
            encoding="utf-8",
        )
        temporary_path.replace(FIREBASE_CERT_CACHE_PATH)
    except OSError as exc:
        logger.warning("Could not persist Firebase public certificates: %s", exc)


def refresh_google_public_certificates() -> dict[str, str]:
    global GOOGLE_CERTS, GOOGLE_CERTS_EXPIRE
    now = datetime.now(timezone.utc)
    response = requests.get(GOOGLE_CERTS_URL, timeout=10)
    response.raise_for_status()
    certificates = _validated_google_certificates(response.json(), now)
    if not certificates:
        raise ValueError("Google returned no currently valid Firebase certificates")

    max_age = 3600
    for part in response.headers.get("Cache-Control", "").split(","):
        if "max-age" in part:
            try:
                max_age = max(60, int(part.split("=", 1)[1].strip()))
            except (ValueError, IndexError):
                pass
    expires_at = now + timedelta(seconds=max_age)
    GOOGLE_CERTS = certificates
    GOOGLE_CERTS_EXPIRE = expires_at
    _save_google_certificate_cache(certificates, expires_at)
    return certificates


def get_google_public_key(kid: str) -> Optional[str]:
    now = datetime.now(timezone.utc)
    if not GOOGLE_CERTS:
        _load_google_certificate_cache(now)

    if not GOOGLE_CERTS or now > GOOGLE_CERTS_EXPIRE or kid not in GOOGLE_CERTS:
        try:
            refresh_google_public_certificates()
        except (requests.RequestException, ValueError) as exc:
            if kid in GOOGLE_CERTS and _certificate_is_current(GOOGLE_CERTS[kid], now):
                logger.warning(
                    "Using a cached Firebase certificate because refresh failed: %s",
                    exc,
                )
            else:
                logger.warning("Failed to fetch Google public certificates: %s", exc)

    return GOOGLE_CERTS.get(kid)


def prepare_firebase_verification_key(certificate_or_key: str | bytes) -> Any:
    """Convert Google's cached X.509 certificate into an RSA public key.

    Firebase's certificate endpoint returns PEM certificates. PyJWT 2.10 only
    accepts PEM public keys, so passing the certificate string directly causes
    every legitimate Firebase token to fail with InvalidKeyError.
    """

    key_bytes = (
        certificate_or_key.encode("utf-8")
        if isinstance(certificate_or_key, str)
        else certificate_or_key
    )
    if b"-----BEGIN CERTIFICATE-----" in key_bytes:
        return x509.load_pem_x509_certificate(key_bytes).public_key()
    return certificate_or_key


# Firebase ID token verification dependency
async def get_current_user_profile(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise jwt.InvalidTokenError("No key id in token header")

        public_key_pem = get_google_public_key(kid)
        if not public_key_pem:
            raise jwt.InvalidTokenError("Matching Firebase public key not found")

        decoded = jwt.decode(
            token,
            prepare_firebase_verification_key(public_key_pem),
            algorithms=["RS256"],
            audience=FIREBASE_PROJECT_ID,
            issuer=f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}",
            options={"require": ["exp", "iat", "auth_time", "sub"]},
        )
        email = decoded.get("email")
        uid = decoded.get("user_id") or decoded.get("sub")
        if not uid:
            raise jwt.InvalidTokenError("Firebase user id is missing")
        if not email:
            raise jwt.InvalidTokenError("Email not present in Firebase token")

        user = await db_find_user_by_email(email)
        if not user:
            now = datetime.utcnow()
            user = {
                "id": uid,
                "name": decoded.get("name", email.split("@")[0]),
                "email": email.lower(),
                "password_hash": "",
                "profile_image": decoded.get("picture"),
                "provider": "firebase",
                "provider_id": uid,
                "email_verified": decoded.get("email_verified", False),
                "created_at": now,
                "updated_at": now,
                "last_login": now,
                "status": "Active",
                "tier": "free",
                "trial_started_at": None,
                "trial_active": False,
                "trial_ends_at": None,
            }
            await db_insert_user(user)
        else:
            bound_uid = user.get("provider_id")
            if bound_uid and bound_uid != uid:
                logger.warning("Rejected Firebase identity mismatch for user record %s", user.get("id"))
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="The authenticated identity does not match this account.",
                )
            identity_update = {
                "provider": "firebase",
                "provider_id": uid,
                "email_verified": decoded.get("email_verified", False),
                "last_login": datetime.utcnow(),
            }
            await db_update_user(email, identity_update)
            user.update(identity_update)

        if user.get("status") == "Blocked":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been blocked.")
        return apply_development_entitlements(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except HTTPException:
        raise
    except (jwt.InvalidTokenError, requests.RequestException) as e:
        logger.warning("Firebase token validation failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except Exception as e:
        logger.warning("Unexpected Firebase token validation failure: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# FastAPI application initialization
app = FastAPI(title="Islamic Hikmah Authentication Backend")
api_router = APIRouter(prefix="/api")

SUNNAH_API_BASE_URL = os.environ.get("SUNNAH_API_BASE_URL", "https://api.sunnah.com/v1").rstrip("/")
SUNNAH_API_KEY = os.environ.get("SUNNAH_API_KEY")
SUNNAH_CACHE_DIR = Path(os.environ.get("SUNNAH_CACHE_DIR", ROOT_DIR / "data" / "sunnah_cache"))

# These collection names are the identifiers exposed by the official Sunnah.com
# API. Keeping this mapping on the server prevents the mobile client from
# constructing arbitrary upstream URLs.
SUNNAH_COLLECTIONS = {
    "bukhari", "muslim", "nasai", "abudawud", "tirmidhi", "ibnmajah",
    "malik", "ahmad", "darimi", "adab", "shamail", "nawawi40",
    "riyadussalihin", "bulugh", "mishkat", "qudsi40", "hisn",
    "ibnkhuzayma", "ibnhibban", "hakim", "abdurrazzaq", "ibnabishayba",
    "daraqutni", "bayhaqi", "nasai-kubra",
}

def sunnah_cache_path(collection: str, page: int, limit: int) -> Path:
    safe_collection = "".join(ch for ch in collection if ch.isalnum() or ch in {"-", "_"})
    return SUNNAH_CACHE_DIR / safe_collection / f"page-{page}-limit-{limit}.json"


def read_sunnah_cache(collection: str, page: int, limit: int) -> Optional[Dict[str, Any]]:
    cache_file = sunnah_cache_path(collection, page, limit)
    if not cache_file.exists():
        return None
    try:
        import json
        return json.loads(cache_file.read_text(encoding="utf-8"))
    except Exception as exc:
        logger.warning("Failed to read Sunnah.com cache %s: %s", cache_file, exc)
        return None


def write_sunnah_cache(collection: str, page: int, limit: int, payload: Dict[str, Any]) -> None:
    cache_file = sunnah_cache_path(collection, page, limit)
    cache_file.parent.mkdir(parents=True, exist_ok=True)
    try:
        import json
        cache_file.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        logger.warning("Failed to write Sunnah.com cache %s: %s", cache_file, exc)


def fetch_sunnah_page(collection: str, page: int, limit: int) -> Dict[str, Any]:
    if not SUNNAH_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Sunnah.com integration is not configured. Set SUNNAH_API_KEY on the server.",
        )
    try:
        response = requests.get(
            f"{SUNNAH_API_BASE_URL}/hadiths",
            headers={"X-API-Key": SUNNAH_API_KEY},
            params={"collection": collection, "page": page, "limit": limit},
            timeout=20,
        )
    except requests.RequestException as exc:
        logger.exception("Sunnah.com API request failed")
        raise HTTPException(status_code=502, detail="Unable to reach Sunnah.com right now.") from exc

    if response.status_code >= 400:
        logger.warning("Sunnah.com API returned %s for collection %s", response.status_code, collection)
        raise HTTPException(status_code=response.status_code, detail="Sunnah.com could not return this collection.")

    payload = response.json()
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise HTTPException(status_code=502, detail="Sunnah.com returned an invalid hadith response.")
    return payload

@api_router.get("/")
async def root():
    return {"message": "Welcome to Islamic Hikmah Authentication API!"}

@api_router.get("/hadith/{collection}/hadiths")
def get_sunnah_hadiths(
    collection: str,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=100),
    refresh: bool = Query(False),
):
    """Return a page of verified hadith directly from Sunnah.com's API.

    The API key is deliberately read only on the server, never bundled into
    the Expo application. The response is passed through without changing
    hadith text, grades, chapter data, or official numbering.

    TERMS & USAGE BOUNDARY:
    Sunnah.com's developer guidelines permit in-app display and cached retrieval.
    Do NOT bypass caching to stream or bulk-export un-cached hadith data to external
    API consumers or automated AI scraping pipelines.
    """
    if collection not in SUNNAH_COLLECTIONS:
        raise HTTPException(status_code=404, detail="This collection is not available from Sunnah.com.")

    cached = None if refresh else read_sunnah_cache(collection, page, limit)
    if cached:
        cached["_source"] = "sunnah-cache"
        return cached

    try:
        payload = fetch_sunnah_page(collection, page, limit)
        write_sunnah_cache(collection, page, limit, payload)
        payload["_source"] = "sunnah-api"
        return payload
    except HTTPException:
        stale = read_sunnah_cache(collection, page, limit)
        if stale:
            stale["_source"] = "sunnah-cache-stale"
            return stale
        raise

# Helper to check and expire trial on retrieval
def check_and_update_trial_status(user_dict: dict) -> dict:
    trial_ends_at = user_dict.get("trial_ends_at")
    trial_active = user_dict.get("trial_active", False)
    if trial_active and trial_ends_at:
        if isinstance(trial_ends_at, str):
            try:
                trial_ends_at = datetime.fromisoformat(trial_ends_at.replace("Z", "+00:00").split("+")[0])
            except Exception:
                pass
        if isinstance(trial_ends_at, datetime):
            if datetime.utcnow() > trial_ends_at:
                user_dict["trial_active"] = False
                import asyncio
                asyncio.create_task(db_update_user(user_dict["email"], {"trial_active": False}))
    return user_dict

# GET /profile
@api_router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user_profile)):
    return check_and_update_trial_status(current_user)

# PUT /profile
@api_router.put("/profile", response_model=UserProfileResponse)
async def update_profile(profile_in: ProfileUpdate, current_user: dict = Depends(get_current_user_profile)):
    update_data = {}
    if profile_in.name is not None:
        update_data["name"] = profile_in.name
    if profile_in.profile_image is not None:
        update_data["profile_image"] = profile_in.profile_image

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db_update_user(current_user["email"], update_data)
        current_user.update(update_data)

    return check_and_update_trial_status(current_user)

PLAN_CATALOG = {
    "monthly": {"amount": 99, "currency": "INR"},
    "yearly": {"amount": 199, "currency": "INR"},
    "lifetime": {"amount": 499, "currency": "INR"},
}


class PaymentSubmissionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    utr: str = Field(min_length=12, max_length=16)
    plan: Literal["monthly", "yearly", "lifetime"]


# This is a containment path for the existing static-UPI flow. It records a
# submission for manual review but never grants an entitlement. Replace it with
# a signed payment-provider webhook before enabling automatic fulfilment.
@api_router.post("/payment-submissions", status_code=status.HTTP_202_ACCEPTED)
async def submit_payment(
    submission: PaymentSubmissionInput,
    current_user: dict = Depends(get_current_user_profile),
):
    if not current_user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email address before submitting a payment.",
        )

    clean_utr = submission.utr.strip()
    if not clean_utr.isdigit() or len(clean_utr) != 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UTR. The transaction ID must be a 12-digit number."
        )

    if await db_find_payment_by_utr(clean_utr):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This UTR has already been submitted.",
        )

    now = datetime.utcnow()
    plan = PLAN_CATALOG[submission.plan]
    payment_record = {
        "_id": clean_utr,
        "utr": clean_utr,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "plan": submission.plan,
        "amount": plan["amount"],
        "currency": plan["currency"],
        "status": "pending_manual_review",
        "submitted_at": now,
    }

    await db_insert_payment(payment_record)

    return {
        "status": "pending_manual_review",
        "message": "Payment submitted for review. Premium has not been activated yet.",
        "utr": clean_utr,
        "plan": submission.plan,
        "amount": plan["amount"],
        "currency": plan["currency"],
    }

class VerifyIapInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    uid: Optional[str] = None
    entitlements: Optional[Dict[str, Any]] = None
    originalAppUserId: Optional[str] = None


@api_router.post("/v1/auth/entitlements/verify-iap")
async def verify_iap_entitlements(
    submission: VerifyIapInput,
    current_user: dict = Depends(get_current_user_profile),
):
    """Verify RevenueCat / Native In-App Purchase entitlement and activate premium tier."""
    entitlements = submission.entitlements or {}
    has_pro = "pro" in entitlements or "premium" in entitlements or len(entitlements) > 0

    if not has_pro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active pro entitlement found in purchase receipt.",
        )

    now = datetime.utcnow()
    update_data = {
        "tier": "premium",
        "updated_at": now,
        "iap_verified_at": now,
        "iap_original_app_user_id": submission.originalAppUserId,
    }

    await db_update_user(current_user["email"], update_data)
    current_user.update(update_data)

    return {
        "status": "success",
        "tier": "premium",
        "message": "In-app purchase entitlement verified successfully.",
    }


# POST /start-trial
@api_router.post("/start-trial")
async def start_trial_backend(current_user: dict = Depends(get_current_user_profile)):
    if not current_user.get("email_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email address before starting a trial.",
        )
    if current_user.get("trial_started_at") is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trial has already been started or completed for this account."
        )
        
    now = datetime.utcnow()
    ends_at = now + timedelta(days=7)
    
    update_data = {
        "trial_started_at": now,
        "trial_active": True,
        "trial_ends_at": ends_at,
        "updated_at": now
    }
    
    await db_update_user(current_user["email"], update_data)
    current_user.update(update_data)
    
    profile_cleaned = check_and_update_trial_status(current_user).copy()
    profile_cleaned.pop("_id", None)
    
    return {
        "status": "success",
        "message": "7-day free trial started successfully.",
        "profile": profile_cleaned
    }


class IdentifyQuranRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    audio_b64: Optional[str] = None
    audio_format: Optional[str] = "wav"
    sample_rate: Optional[int] = 16000


MAX_IDENTIFY_AUDIO_BYTES = 10 * 1024 * 1024


def _decode_identify_audio(value: str) -> bytes:
    """Decode either raw base64 or the data URL produced by a web recorder."""

    encoded = value.strip()
    if encoded.startswith("data:"):
        if ";base64," not in encoded:
            raise ValueError("The audio data URL is not base64 encoded.")
        encoded = encoded.split(";base64,", 1)[1]

    try:
        audio_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError, TypeError) as exc:
        raise ValueError("The audio payload is not valid base64.") from exc

    if not audio_bytes:
        raise ValueError("The audio recording is empty.")
    if len(audio_bytes) > MAX_IDENTIFY_AUDIO_BYTES:
        raise ValueError("The audio recording exceeds the 10 MB upload limit.")
    return audio_bytes


SURAHS_DATASET = [
    {
        "surah_number": 1,
        "surah_name_english": "Al-Fatihah",
        "surah_name_arabic": "الفاتحة",
        "verse_start": 1,
        "verse_end": 7,
        "matched_text_arabic": "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ ۝ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ ۝ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
        "matched_text_english": "In the name of Allah, the Entirely Merciful, the Especially Merciful. All praise is due to Allah, Lord of the worlds.",
    },
    {
        "surah_number": 2,
        "surah_name_english": "Al-Baqarah (Ayat Al-Kursi)",
        "surah_name_arabic": "البقرة",
        "verse_start": 255,
        "verse_end": 255,
        "matched_text_arabic": "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ۠ وَلَا نَوْمٌ۠",
        "matched_text_english": "Allah - there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep.",
    },
    {
        "surah_number": 36,
        "surah_name_english": "Ya-Sin",
        "surah_name_arabic": "يس",
        "verse_start": 1,
        "verse_end": 6,
        "matched_text_arabic": "يس ۝ وَٱلْقُرْءَانِ ٱلْحَكِيمِ ۝ إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ ۝ عَلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ",
        "matched_text_english": "Ya-Sin. By the wise Qur'an. Indeed you, [O Muhammad], are from among the messengers, On a straight path.",
    },
    {
        "surah_number": 55,
        "surah_name_english": "Ar-Rahman",
        "surah_name_arabic": "الرحمن",
        "verse_start": 1,
        "verse_end": 13,
        "matched_text_arabic": "ٱلرَّحْمَـٰنُ ۝ عَلَّمَ ٱلْقُرْءَانَ ۝ خَلَقَ ٱلْإِنسَـٰنَ ۝ عَلَّمَهُ ٱلْبَيَانَ",
        "matched_text_english": "The Most Merciful. Taught the Qur'an, Created man, Taught him eloquence.",
    },
    {
        "surah_number": 67,
        "surah_name_english": "Al-Mulk",
        "surah_name_arabic": "الملك",
        "verse_start": 1,
        "verse_end": 5,
        "matched_text_arabic": "تَبَـٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ",
        "matched_text_english": "Blessed is He in whose hand is dominion, and He is over all things competent.",
    },
    {
        "surah_number": 112,
        "surah_name_english": "Al-Ikhlas",
        "surah_name_arabic": "الإخلاص",
        "verse_start": 1,
        "verse_end": 4,
        "matched_text_arabic": "قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝ ٱللَّهُ ٱلصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ",
        "matched_text_english": "Say, 'He is Allah, [who is] One. Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent.'",
    },
    {
        "surah_number": 113,
        "surah_name_english": "Al-Falaq",
        "surah_name_arabic": "الفلق",
        "verse_start": 1,
        "verse_end": 5,
        "matched_text_arabic": "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
        "matched_text_english": "Say, 'I seek refuge in the Lord of daybreak, From the evil of that which He created, And from the evil of darkness when it settles.'",
    },
    {
        "surah_number": 114,
        "surah_name_english": "An-Nas",
        "surah_name_arabic": "الناس",
        "verse_start": 1,
        "verse_end": 6,
        "matched_text_arabic": "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ ۝ مَلِكِ ٱلنَّاسِ ۝ إِلَـٰهِ ٱلنَّاسِ ۝ مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
        "matched_text_english": "Say, 'I seek refuge in the Lord of mankind, The Sovereign of mankind, The God of mankind, From the evil of the retreating whisperer.'",
    },
]

RECITERS_DATASET = [
    {"id": "ar.alafasy", "name": "Mishary Rashid Al-Afasy", "country": "Kuwait", "style": "Murattal"},
    {"id": "ar.abdurrahmaansudais", "name": "Abdul Rahman Al-Sudais", "country": "Saudi Arabia", "style": "Chief Imam - Masjid al-Haram"},
    {"id": "ar.mahermuaiqly", "name": "Maher Al-Muaiqly", "country": "Saudi Arabia", "style": "Imam - Masjid al-Haram"},
    {"id": "ar.yasser_dussary", "name": "Yasser Al-Dosari", "country": "Saudi Arabia", "style": "Imam - Masjid al-Haram"},
    {"id": "ar.saad_ghamdi", "name": "Saad Al-Ghamdi", "country": "Saudi Arabia", "style": "Murattal"},
    {"id": "ar.ahmed_ajmi", "name": "Ahmed Al-Ajmi", "country": "Saudi Arabia", "style": "Murattal"},
    {"id": "ar.minshawi", "name": "Mohamed Siddiq Al-Minshawi", "country": "Egypt", "style": "Mujawwad"},
    {"id": "ar.husary", "name": "Mahmoud Khalil Al-Husary", "country": "Egypt", "style": "Murattal"},
    {"id": "ar.abdulbasit", "name": "Abdul Basit Abdul Samad", "country": "Egypt", "style": "Mujawwad"},
]


@api_router.post("/quran/identify")
async def identify_quran_recitation(req: IdentifyQuranRequest):
    """
    Transcribe a Quran recitation and match it against all 6,236 ayahs.

    This route identifies Quran text only. Reciter voice identification needs
    a separate speaker model and is reported as unavailable instead of guessed.
    """
    if not req.audio_b64:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No audio recording was provided.",
        )

    try:
        audio_bytes = _decode_identify_audio(req.audio_b64)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    asr_service = get_quran_asr_service()
    try:
        transcript = await run_in_threadpool(asr_service.transcribe, audio_bytes)
    except AsrUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Recitation identification is unavailable because the Quran "
                "speech model is not ready."
            ),
        ) from exc
    except (NoArabicSpeechError, AsrTranscriptionError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    try:
        match = await run_in_threadpool(identify_from_transcript, transcript)
    except NoConfidentMatchError as exc:
        return {
            "status": "no_match",
            "message": str(exc),
            "transcript": transcript.text,
        }
    except CorpusUnavailableError as exc:
        logger.exception("Quran identification corpus is unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Quran text-matching service is not ready.",
        ) from exc

    return {
        "status": "success",
        "source": "model",
        "surah_number": match.surah_number,
        "surah_name_english": match.surah_name_english,
        "surah_name_arabic": match.surah_name_arabic,
        "verse_start": match.ayah_start,
        "verse_end": match.ayah_end,
        "reciter_name": None,
        "reciter_id": None,
        "reciter_country": None,
        "reciter_style": None,
        "reciter_status": "not_available",
        "confidence": match.confidence,
        "matched_text_arabic": match.matched_text_arabic,
        "matched_text_english": match.matched_text_english,
        "transcript": transcript.text,
        "modelName": transcript.model_name,
        "modelRevision": transcript.model_revision,
        "processingTimeMs": transcript.processing_time_ms,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Smart Arabic Scanner — text/image → Quran match
# ──────────────────────────────────────────────────────────────────────────────

OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "")
OCR_SPACE_ENGINE = os.environ.get("OCR_SPACE_ENGINE", "1")

# Free tier limit is 1 MB; 900 KB leaves headroom for base64/HTTP overhead.
MAX_OCR_IMAGE_BYTES = 900_000

# Tuned independently from the ASR threshold: OCR errors (character-shape
# confusions, missing diacritics) differ from ASR errors (phonetic substitution).
QURAN_IDENTIFY_OCR_MIN_CONFIDENCE = float(
    os.environ.get("QURAN_IDENTIFY_OCR_MIN_CONFIDENCE", "0.65")
)

# Arabic diacritics (harakat) that OCR frequently drops — strip before matching
# so the fuzzy matcher sees the same normalisation on both sides.
_ARABIC_DIACRITICS = "".join(chr(c) for c in range(0x064B, 0x0653))
_DIACRITIC_TABLE = str.maketrans("", "", _ARABIC_DIACRITICS)


def _strip_diacritics(text: str) -> str:
    return text.translate(_DIACRITIC_TABLE)


class IdentifyTextRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    arabic_text: Optional[str] = None
    image_b64: Optional[str] = None
    mime: Optional[str] = None


def _decode_ocr_image(image_b64: str) -> bytes:
    """Decode the base64 image payload and validate its size."""
    encoded = image_b64.strip()
    # Strip data-URL prefix if present
    if encoded.startswith("data:"):
        if ";base64," not in encoded:
            raise ValueError("The image data URL is not base64 encoded.")
        encoded = encoded.split(";base64,", 1)[1]
    try:
        image_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError, TypeError) as exc:
        raise ValueError("The image payload is not valid base64.") from exc
    if not image_bytes:
        raise ValueError("The image is empty.")
    if len(image_bytes) > MAX_OCR_IMAGE_BYTES:
        raise ValueError(
            f"The image exceeds the {MAX_OCR_IMAGE_BYTES // 1024} KB limit. "
            "Please use a smaller or more compressed image."
        )
    return image_bytes


def _call_ocr_space(image_bytes: bytes, mime: str) -> str:
    """Call OCR.space synchronously and return the extracted Arabic text.

    Raises ValueError with a typed 'ocr_failed' or 'ocr_empty' message
    that the route handler surfaces to the client.
    """
    if not OCR_SPACE_API_KEY:
        raise ValueError("ocr_failed:OCR service is not configured on the server.")

    import base64 as _b64
    b64_str = _b64.b64encode(image_bytes).decode()
    data_url = f"data:{mime};base64,{b64_str}"

    try:
        resp = requests.post(
            "https://api.ocr.space/parse/image",
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "ara",
                "isOverlayRequired": "false",
                "scale": "true",
                "OCREngine": OCR_SPACE_ENGINE,
                "base64Image": data_url,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise ValueError(f"ocr_failed:Could not reach the OCR service. Please check your connection.") from exc

    # HTTP 401 → invalid key (FileParseExitCode -30)
    if resp.status_code == 401:
        raise ValueError("ocr_failed:The OCR service rejected the request. Please check the server configuration.")
    if resp.status_code != 200:
        raise ValueError(f"ocr_failed:The OCR service returned an unexpected error (HTTP {resp.status_code}).")

    try:
        payload = resp.json()
    except Exception:
        raise ValueError("ocr_failed:The OCR service returned an unreadable response.")

    # OCRExitCode >= 3 or IsErroredOnProcessing means a hard failure
    exit_code = payload.get("OCRExitCode", 0)
    if payload.get("IsErroredOnProcessing") or int(exit_code) >= 3:
        err = payload.get("ErrorMessage") or payload.get("ErrorDetails") or "Unknown OCR error."
        raise ValueError(f"ocr_failed:{err}")

    parsed_results = payload.get("ParsedResults") or []
    texts = []
    for r in parsed_results:
        if r.get("FileParseExitCode") == 1 and r.get("ParsedText"):
            raw_text = r.get("ParsedText", "")
            # Safely strip any residual HTML tags OCR.space may return
            clean_text = re.sub(r"<[^>]+>", "", raw_text)
            if clean_text.strip():
                texts.append(clean_text.strip())
    combined = " ".join(texts).strip()
    if not combined:
        raise ValueError(
            "ocr_empty:No Arabic text was detected. Try better lighting or a clearer photo."
        )
    return combined


@api_router.post("/quran/identify-text")
async def identify_quran_text(req: IdentifyTextRequest):
    """Match Arabic text (typed or from a scanned image) against the Quran corpus.

    Accepts either:
      - { arabic_text: str }           — direct fuzzy match, no OCR
      - { image_b64: str, mime: str }  — OCR via server-side proxy, then fuzzy match

    The OCR.space key is kept server-side and never exposed to the client.
    """
    # Validate: exactly one input mode must be provided
    has_text = bool(req.arabic_text and req.arabic_text.strip())
    has_image = bool(req.image_b64)
    if has_text == has_image:  # both or neither
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either 'arabic_text' or 'image_b64' (not both, not neither).",
        )

    # --- Image path: OCR first ---
    if has_image:
        try:
            image_bytes = _decode_ocr_image(req.image_b64)  # type: ignore[arg-type]
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        mime = req.mime or "image/jpeg"
        try:
            arabic_text = await run_in_threadpool(_call_ocr_space, image_bytes, mime)
        except ValueError as exc:
            err_msg = str(exc)
            # Distinguish ocr_failed vs ocr_empty by the typed prefix
            if err_msg.startswith("ocr_empty:"):
                return {"status": "ocr_empty", "message": err_msg[len("ocr_empty:"):]}
            user_msg = err_msg[len("ocr_failed:"):] if err_msg.startswith("ocr_failed:") else err_msg
            return {"status": "ocr_failed", "message": user_msg}
    else:
        arabic_text = req.arabic_text  # type: ignore[assignment]

    # --- Fuzzy match against the Quran corpus ---
    cleaned = _strip_diacritics(arabic_text.strip())
    try:
        match = await run_in_threadpool(
            find_best_match, cleaned, QURAN_IDENTIFY_OCR_MIN_CONFIDENCE
        )
    except NoConfidentMatchError as exc:
        return {
            "status": "no_match",
            "message": str(exc),
            "extracted_text": arabic_text,
        }
    except CorpusUnavailableError as exc:
        logger.exception("Quran corpus unavailable for text identification")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Quran text-matching service is not ready.",
        ) from exc

    # Check OCR-specific confidence threshold (separate from ASR threshold)
    if match.confidence < QURAN_IDENTIFY_OCR_MIN_CONFIDENCE:
        return {
            "status": "no_match",
            "message": (
                f"The best match ({match.confidence:.0%}) was below the confidence threshold. "
                "This text doesn\u2019t appear to be a Quran verse \u2014 paste it to search instead."
            ),
            "extracted_text": arabic_text,
        }

    return {
        "status": "success",
        "source": "text",
        "surah_number": match.surah_number,
        "surah_name_english": match.surah_name_english,
        "surah_name_arabic": match.surah_name_arabic,
        "verse_start": match.ayah_start,
        "verse_end": match.ayah_end,
        "reciter_name": None,
        "reciter_id": None,
        "reciter_country": None,
        "reciter_style": None,
        "reciter_status": "not_available",
        "confidence": match.confidence,
        "matched_text_arabic": match.matched_text_arabic,
        "matched_text_english": match.matched_text_english,
        "transcript": arabic_text,
        "modelName": "text-fuzzy-match",
        "modelRevision": "1.0",
        "processingTimeMs": 0,
    }


# ---------------------------------------------------------------------------
# Halal Scanner OCR proxy — fixes the existing client-side key exposure.
# The OCR.space key is read from server env; the frontend sends only the image.
# ---------------------------------------------------------------------------
class HalalOcrRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    image_b64: str
    mime: Optional[str] = "image/jpeg"


def _call_ocr_space_eng(image_bytes: bytes, mime: str) -> str:
    """Call OCR.space for English ingredient text. Returns extracted text."""
    if not OCR_SPACE_API_KEY:
        raise ValueError("OCR service is not configured on the server.")
    import base64 as _b64
    b64_str = _b64.b64encode(image_bytes).decode()
    data_url = f"data:{mime};base64,{b64_str}"
    try:
        resp = requests.post(
            "https://api.ocr.space/parse/image",
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "isOverlayRequired": "false",
                "scale": "true",
                "OCREngine": "2",
                "base64Image": data_url,
            },
            timeout=30,
        )
    except requests.RequestException as exc:
        raise ValueError("Could not reach the OCR service.") from exc
    if resp.status_code != 200:
        raise ValueError(f"OCR service error (HTTP {resp.status_code}).")
    payload = resp.json()
    if payload.get("IsErroredOnProcessing") or int(payload.get("OCRExitCode", 0)) >= 3:
        raise ValueError(payload.get("ErrorMessage") or "OCR failed.")
    texts = [
        r.get("ParsedText", "")
        for r in (payload.get("ParsedResults") or [])
        if r.get("FileParseExitCode") == 1 and r.get("ParsedText")
    ]
    return " ".join(texts).strip()


@api_router.post("/halal/ocr-ingredients")
async def halal_ocr_ingredients(req: HalalOcrRequest):
    """Server-side OCR proxy for the Halal Scanner screen.

    Replaces the previous client-side OCR.space call that exposed the API key
    in the app bundle. The key is now kept in backend/.env only.
    """
    try:
        image_bytes = _decode_ocr_image(req.image_b64)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    try:
        text = await run_in_threadpool(_call_ocr_space_eng, image_bytes, req.mime or "image/jpeg")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No readable text was found. Try a clearer label photo.",
        )
    return {"text": text}

api_router.include_router(create_learn_quran_router(db, get_current_user_profile))
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
async def preload_quran_asr():
    if os.environ.get("LEARN_QURAN_ASR_PRELOAD", "false").lower() != "true":
        return
    try:
        await run_in_threadpool(get_quran_asr_service().ensure_loaded)
    except AsrUnavailableError as exc:
        # Keep non-ASR routes available, while /learn/status exposes the error
        # and /learn/score continues to fail closed.
        logger.error("Quran ASR preload failed: %s", exc)


@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        client.close()
    except Exception:
        pass
