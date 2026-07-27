from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field
from typing import Any, Dict, Literal, Optional
from datetime import datetime, timedelta, timezone
import jwt
import requests
from cryptography import x509
from pymongo.errors import DuplicateKeyError
from learn_quran.router import create_learn_quran_router
from learn_quran.asr import AsrUnavailableError, get_quran_asr_service

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

# Include routes & CORS middleware configuration
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
