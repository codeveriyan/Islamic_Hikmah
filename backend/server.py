from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header, Query, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorClient
import base64
import binascii
import os
import logging
import json
import hmac
from pathlib import Path
from pydantic import BaseModel, ConfigDict, Field
from collections import defaultdict
from typing import Any, Dict, Literal, Optional
from datetime import datetime, timedelta, timezone
import jwt
import re
import requests
import hashlib
import html
import math
import urllib.parse
import urllib.request
import asyncio
import httpx
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

ALLOW_IN_MEMORY_DB = os.environ.get("ALLOW_IN_MEMORY_DB", "false").lower() == "true"
IN_MEMORY_DB = {
    "users": {},
    "payments": {},
    "billing_events": {},
}

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
REVENUECAT_SECRET_KEY = os.environ.get("REVENUECAT_SECRET_KEY", "").strip()
REVENUECAT_API_BASE_URL = os.environ.get(
    "REVENUECAT_API_BASE_URL", "https://api.revenuecat.com/v1"
).rstrip("/")
REVENUECAT_ENTITLEMENT_ID = os.environ.get("REVENUECAT_ENTITLEMENT_ID", "pro").strip()
REVENUECAT_WEBHOOK_AUTH_TOKEN = os.environ.get("REVENUECAT_WEBHOOK_AUTH_TOKEN", "").strip()
PAYMENT_ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.environ.get("PAYMENT_ADMIN_EMAILS", "").split(",")
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

RATE_LIMIT_BACKEND = os.environ.get("RATE_LIMIT_BACKEND", "memory").lower()
RATE_LIMIT_STORE: Dict[str, list[float]] = defaultdict(list)
TRUST_PROXY_HEADERS = os.environ.get("TRUST_PROXY_HEADERS", "false").lower() == "true"

def _get_client_ip(request: Request) -> str:
    if TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request and request.client else "127.0.0.1"


def check_rate_limit(key: str, limit_per_min: int):
    now = datetime.now(timezone.utc).timestamp()
    cutoff = now - 60.0
    history = [t for t in RATE_LIMIT_STORE[key] if t > cutoff]
    if len(history) >= limit_per_min:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit of {limit_per_min} requests/min exceeded. Please wait a minute before trying again.",
        )
    history.append(now)
    RATE_LIMIT_STORE[key] = history


class AyahFinderResult(BaseModel):
    model_config = ConfigDict(extra="allow", protected_namespaces=())

    schema_version: int = 1
    status: Literal["success", "no_match", "ambiguous", "ocr_failed", "ocr_empty"]
    match_type: Optional[Literal["exact", "partial", "ambiguous"]] = None
    source: Literal["asr", "ocr", "text", "model"]

    surah_number: Optional[int] = None
    surah_name_english: Optional[str] = None
    surah_name_arabic: Optional[str] = None
    verse_start: Optional[int] = None
    verse_end: Optional[int] = None

    confidence: Optional[float] = None
    ocr_confidence: Optional[float] = None
    best_candidate_confidence: Optional[float] = None

    matched_text_arabic: Optional[str] = None
    matched_text_english: Optional[str] = None
    recognized_text: str
    transcript: Optional[str] = None
    warnings: Optional[list[str]] = None
    processing_time_ms: int = 0

    model_name: Optional[str] = None
    model_revision: Optional[str] = None
    matcher_version: Optional[str] = "1.0.0"


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
    premium_until: Optional[datetime] = None
    premium_source: Optional[str] = None
    trial_started_at: Optional[datetime] = None
    trial_active: bool = False
    trial_ends_at: Optional[datetime] = None

def _use_development_memory_store() -> bool:
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


async def db_find_user_by_id(user_id: str):
    if _use_development_memory_store():
        return next(
            (user for user in IN_MEMORY_DB["users"].values() if user.get("id") == user_id),
            None,
        )
    try:
        return await db.users.find_one({"id": user_id})
    except Exception as e:
        _database_unavailable("user id lookup", e)
        return next(
            (user for user in IN_MEMORY_DB["users"].values() if user.get("id") == user_id),
            None,
        )


async def db_update_user_by_id(user_id: str, update_dict: dict):
    if _use_development_memory_store():
        user = await db_find_user_by_id(user_id)
        if user:
            user.update(update_dict)
        return
    try:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    except Exception as e:
        _database_unavailable("user id update", e)
        user = await db_find_user_by_id(user_id)
        if user:
            user.update(update_dict)
        return


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


async def db_transition_payment(utr: str, expected_status: str, update_dict: dict) -> bool:
    if _use_development_memory_store():
        payment = IN_MEMORY_DB["payments"].get(utr)
        if not payment or payment.get("status") != expected_status:
            return False
        payment.update(update_dict)
        return True
    try:
        result = await db.payments.update_one(
            {"_id": utr, "status": expected_status},
            {"$set": update_dict},
        )
        return result.modified_count == 1
    except Exception as e:
        _database_unavailable("payment transition", e)
        payment = IN_MEMORY_DB["payments"].get(utr)
        if not payment or payment.get("status") != expected_status:
            return False
        payment.update(update_dict)
        return True


async def db_insert_billing_event(event_id: str, event_record: dict) -> bool:
    if _use_development_memory_store():
        if event_id in IN_MEMORY_DB["billing_events"]:
            return False
        IN_MEMORY_DB["billing_events"][event_id] = event_record
        return True
    try:
        await db.billing_events.insert_one({"_id": event_id, **event_record})
        return True
    except DuplicateKeyError:
        return False
    except Exception as e:
        _database_unavailable("billing event insert", e)
        if event_id in IN_MEMORY_DB["billing_events"]:
            return False
        IN_MEMORY_DB["billing_events"][event_id] = event_record
        return True

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
    key_bytes = (
        certificate_or_key.encode("utf-8")
        if isinstance(certificate_or_key, str)
        else certificate_or_key
    )
    if b"-----BEGIN CERTIFICATE-----" in key_bytes:
        return x509.load_pem_x509_certificate(key_bytes).public_key()
    return certificate_or_key


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
            now = datetime.now(timezone.utc)
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
                "last_login": datetime.now(timezone.utc),
            }
            await db_update_user(email, identity_update)
            user.update(identity_update)

        if user.get("status") == "Blocked":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been blocked.")
        user = check_and_update_trial_status(user)
        user = check_and_update_premium_status(user)
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


async def get_optional_user_profile(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_user_profile(authorization)
    except HTTPException:
        return None


app = FastAPI(title="Islamic Hikmah Authentication Backend")
api_router = APIRouter(prefix="/api")

SUNNAH_API_BASE_URL = os.environ.get("SUNNAH_API_BASE_URL", "https://api.sunnah.com/v1").rstrip("/")
SUNNAH_API_KEY = os.environ.get("SUNNAH_API_KEY")
SUNNAH_CACHE_DIR = Path(os.environ.get("SUNNAH_CACHE_DIR", ROOT_DIR / "data" / "sunnah_cache"))

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

def check_and_update_trial_status(user_dict: dict) -> dict:
    trial_ends_at = user_dict.get("trial_ends_at")
    trial_active = user_dict.get("trial_active", False)
    if trial_active and trial_ends_at:
        parsed_trial_ends_at = _parse_provider_datetime(trial_ends_at)
        if parsed_trial_ends_at:
            if datetime.now(timezone.utc) > parsed_trial_ends_at:
                user_dict["trial_active"] = False
                _safe_bg_task(db_update_user(user_dict["email"], {"trial_active": False}))
    return user_dict


def check_and_update_premium_status(user_dict: dict) -> dict:
    premium_until = _parse_provider_datetime(user_dict.get("premium_until"))
    if (
        user_dict.get("tier") == "premium"
        and premium_until is not None
        and premium_until <= datetime.now(timezone.utc)
    ):
        user_dict["tier"] = "free"
        user_dict["premium_until"] = None
        _safe_bg_task(
            db_update_user(
                user_dict["email"],
                {"tier": "free", "premium_until": None, "updated_at": datetime.now(timezone.utc)},
            )
        )
    return user_dict


def _parse_provider_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, tz=timezone.utc)
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _provider_entitlement_is_active(entitlement: Any) -> bool:
    if not isinstance(entitlement, dict):
        return False
    if entitlement.get("gives_access") is False:
        return False
    expires_at = _parse_provider_datetime(entitlement.get("expires_date"))
    return expires_at is None or expires_at > datetime.now(timezone.utc)


async def fetch_revenuecat_entitlement(app_user_id: str) -> dict[str, Any]:
    if not REVENUECAT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment verification is not configured on the server.",
        )
    if not app_user_id or len(app_user_id) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment customer identifier.",
        )

    subscriber_url = f"{REVENUECAT_API_BASE_URL}/subscribers/{urllib.parse.quote(app_user_id, safe='')}"
    try:
        response = await run_in_threadpool(
            requests.get,
            subscriber_url,
            headers={"Authorization": f"Bearer {REVENUECAT_SECRET_KEY}"},
            timeout=10,
        )
    except requests.RequestException as exc:
        logger.warning("RevenueCat subscriber lookup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to verify the payment with the billing provider.",
        ) from exc

    if response.status_code == 404:
        return {
            "active": False,
            "entitlement": None,
            "original_app_user_id": app_user_id,
        }
    if response.status_code in {401, 403}:
        logger.error("RevenueCat rejected the server API key with status %s", response.status_code)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment verification is temporarily unavailable.",
        )
    if response.status_code >= 400:
        logger.warning("RevenueCat subscriber lookup returned %s", response.status_code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The billing provider could not verify this purchase.",
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The billing provider returned an invalid response.",
        ) from exc

    subscriber = payload.get("subscriber") if isinstance(payload, dict) else None
    entitlements = subscriber.get("entitlements") if isinstance(subscriber, dict) else None
    entitlement = entitlements.get(REVENUECAT_ENTITLEMENT_ID) if isinstance(entitlements, dict) else None
    return {
        "active": _provider_entitlement_is_active(entitlement),
        "entitlement": entitlement,
        "original_app_user_id": (
            subscriber.get("original_app_user_id")
            if isinstance(subscriber, dict)
            else app_user_id
        ) or app_user_id,
    }


async def persist_revenuecat_entitlement(user: dict, provider_state: dict[str, Any]) -> dict:
    entitlement = provider_state.get("entitlement") or {}
    expires_at = _parse_provider_datetime(entitlement.get("expires_date"))
    update_data = {
        "updated_at": datetime.now(timezone.utc),
        "iap_verified_at": datetime.now(timezone.utc),
        "iap_original_app_user_id": provider_state.get("original_app_user_id"),
    }
    if provider_state.get("active"):
        update_data.update(
            {
                "tier": "premium",
                "premium_source": "revenuecat",
                "premium_until": expires_at,
                "premium_product_id": entitlement.get("product_identifier"),
            }
        )
    elif user.get("premium_source") == "revenuecat":
        update_data.update({"tier": "free", "premium_until": None})

    await db_update_user(user["email"], update_data)
    user.update(update_data)
    return user

@api_router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user_profile)):
    return check_and_update_trial_status(current_user)

@api_router.put("/profile", response_model=UserProfileResponse)
async def update_profile(profile_in: ProfileUpdate, current_user: dict = Depends(get_current_user_profile)):
    update_data = {}
    if profile_in.name is not None:
        update_data["name"] = profile_in.name
    if profile_in.profile_image is not None:
        update_data["profile_image"] = profile_in.profile_image

    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
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

    now = datetime.now(timezone.utc)
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
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    app_user_id: Optional[str] = Field(default=None, alias="appUserId")


@api_router.post("/v1/auth/entitlements/verify-iap")
async def verify_iap_entitlements(
    submission: VerifyIapInput,
    current_user: dict = Depends(get_current_user_profile),
):
    expected_app_user_id = current_user["id"]
    if submission.app_user_id and submission.app_user_id != expected_app_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The payment customer does not match the signed-in account.",
        )

    provider_state = await fetch_revenuecat_entitlement(expected_app_user_id)
    await persist_revenuecat_entitlement(current_user, provider_state)

    if not provider_state.get("active"):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No active premium purchase was found for this account.",
        )

    return {
        "status": "success",
        "tier": "premium",
        "message": "In-app purchase entitlement verified successfully.",
    }


@api_router.post("/webhooks/revenuecat", include_in_schema=False)
async def revenuecat_webhook(request: Request):
    authorization = request.headers.get("authorization", "")
    if (
        not REVENUECAT_WEBHOOK_AUTH_TOKEN
        or not hmac.compare_digest(authorization, REVENUECAT_WEBHOOK_AUTH_TOKEN)
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook authorization.")

    try:
        payload = json.loads(await request.body())
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook JSON.") from exc

    event = payload.get("event") if isinstance(payload, dict) else None
    if not isinstance(event, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook event is missing.")

    event_id = str(event.get("id") or "").strip()
    app_user_id = str(event.get("app_user_id") or "").strip()
    if not event_id or not app_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Webhook identity is missing.")

    user = await db_find_user_by_id(app_user_id)
    if not user:
        return {"status": "ignored", "reason": "account_not_found"}

    provider_state = await fetch_revenuecat_entitlement(app_user_id)
    inserted = await db_insert_billing_event(
        event_id,
        {
            "event_type": event.get("type"),
            "app_user_id": app_user_id,
            "received_at": datetime.now(timezone.utc),
        },
    )
    if not inserted:
        return {"status": "duplicate", "event_id": event_id}

    await persist_revenuecat_entitlement(user, provider_state)
    return {
        "status": "processed",
        "event_id": event_id,
        "active": bool(provider_state.get("active")),
    }


class PaymentReviewInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision: Literal["approve", "reject"]
    note: Optional[str] = Field(default=None, max_length=500)


@api_router.post("/payment-submissions/{utr}/review")
async def review_payment_submission(
    utr: str,
    review: PaymentReviewInput,
    current_user: dict = Depends(get_current_user_profile),
):
    if (
        not current_user.get("email_verified", False)
        or current_user.get("email", "").lower() not in PAYMENT_ADMIN_EMAILS
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Payment review access is restricted.")

    clean_utr = utr.strip()
    if not clean_utr.isdigit() or len(clean_utr) != 12:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UTR.")

    payment = await db_find_payment_by_utr(clean_utr)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment submission not found.")
    if payment.get("status") != "pending_manual_review":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment is no longer awaiting review.")

    now = datetime.now(timezone.utc)
    payment_update = {
        "status": "approved" if review.decision == "approve" else "rejected",
        "reviewed_at": now,
        "reviewed_by": current_user["email"],
        "review_note": review.note,
    }
    transitioned = await db_transition_payment(clean_utr, "pending_manual_review", payment_update)
    if not transitioned:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Payment is no longer awaiting review.")

    if review.decision == "approve":
        duration_days = {"monthly": 31, "yearly": 366}.get(payment.get("plan"))
        entitlement_update = {
            "tier": "premium",
            "premium_source": "upi_manual",
            "premium_granted_at": now,
            "premium_plan": payment.get("plan"),
            "premium_until": now + timedelta(days=duration_days) if duration_days else None,
            "updated_at": now,
        }
        await db_update_user_by_id(payment["user_id"], entitlement_update)

    return {"status": payment_update["status"], "utr": clean_utr}


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
        
    now = datetime.now(timezone.utc)
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


@api_router.post("/quran/identify", response_model=AyahFinderResult)
async def identify_quran_recitation(
    req: IdentifyQuranRequest,
    request: Request,
    user: Optional[dict] = Depends(get_optional_user_profile),
):
    client_ip = _get_client_ip(request)
    limit = 10 if (user and user.get("tier") == "premium") else (10 if user else 3)
    check_rate_limit(f"audio:{client_ip}", limit_per_min=limit)

    if not req.audio_b64:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No audio recording was provided.",
        )

    try:
        audio_bytes = _decode_identify_audio(req.audio_b64)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            if "limit" in str(exc).lower()
            else status.HTTP_422_UNPROCESSABLE_ENTITY,
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
    except AsrTranscriptionError as exc:
        if "30-second" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=str(exc),
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except NoArabicSpeechError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    try:
        match = await run_in_threadpool(identify_from_transcript, transcript)
    except NoConfidentMatchError as exc:
        return {
            "schema_version": 1,
            "status": "no_match",
            "match_type": None,
            "source": "asr",
            "message": str(exc),
            "recognized_text": transcript.text,
            "transcript": transcript.text,
            "confidence": None,
            "model_name": transcript.model_name,
            "modelName": transcript.model_name,
            "model_revision": transcript.model_revision,
            "modelRevision": transcript.model_revision,
            "matcher_version": "1.0.0",
            "processing_time_ms": transcript.processing_time_ms,
            "processingTimeMs": transcript.processing_time_ms,
        }
    except CorpusUnavailableError as exc:
        logger.exception("Quran identification corpus is unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Quran text-matching service is not ready.",
        ) from exc

    match_type_val = "exact" if match.confidence >= 0.95 else "partial"

    return {
        "schema_version": 1,
        "status": "success",
        "match_type": match_type_val,
        "source": "asr",
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
        "ocr_confidence": None,
        "matched_text_arabic": match.matched_text_arabic,
        "matched_text_english": match.matched_text_english,
        "recognized_text": transcript.text,
        "transcript": transcript.text,
        "model_name": transcript.model_name,
        "modelName": transcript.model_name,
        "model_revision": transcript.model_revision,
        "modelRevision": transcript.model_revision,
        "matcher_version": "1.0.0",
        "processing_time_ms": transcript.processing_time_ms,
        "processingTimeMs": transcript.processing_time_ms,
    }


OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "")
OCR_SPACE_ENGINE = os.environ.get("OCR_SPACE_ENGINE", "1")

MAX_OCR_IMAGE_BYTES = 900_000

QURAN_IDENTIFY_OCR_MIN_CONFIDENCE = float(
    os.environ.get("QURAN_IDENTIFY_OCR_MIN_CONFIDENCE", "0.65")
)

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
    encoded = image_b64.strip()
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

    if resp.status_code == 401:
        raise ValueError("ocr_failed:The OCR service rejected the request. Please check the server configuration.")
    if resp.status_code != 200:
        raise ValueError(f"ocr_failed:The OCR service returned an unexpected error (HTTP {resp.status_code}).")

    try:
        payload = resp.json()
    except Exception:
        raise ValueError("ocr_failed:The OCR service returned an unreadable response.")

    exit_code = payload.get("OCRExitCode", 0)
    if payload.get("IsErroredOnProcessing") or int(exit_code) >= 3:
        err = payload.get("ErrorMessage") or payload.get("ErrorDetails") or "Unknown OCR error."
        raise ValueError(f"ocr_failed:{err}")

    parsed_results = payload.get("ParsedResults") or []
    texts = []
    for r in parsed_results:
        if r.get("FileParseExitCode") == 1 and r.get("ParsedText"):
            raw_text = r.get("ParsedText", "")
            clean_text = re.sub(r"<[^>]+>", "", raw_text)
            if clean_text.strip():
                texts.append(clean_text.strip())
    combined = " ".join(texts).strip()
    if not combined:
        raise ValueError(
            "ocr_empty:No Arabic text was detected. Try better lighting or a clearer photo."
        )
    return combined


@api_router.post("/quran/identify-text", response_model=AyahFinderResult)
async def identify_quran_text(
    req: IdentifyTextRequest, 
    request: Request,
    user: Optional[dict] = Depends(get_optional_user_profile),
):
    client_ip = _get_client_ip(request)
    limit = 5 if user else 2
    check_rate_limit(f"ocr:{client_ip}", limit_per_min=limit)

    has_text = bool(req.arabic_text and req.arabic_text.strip())
    has_image = bool(req.image_b64)
    if has_text == has_image:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Provide either 'arabic_text' or 'image_b64' (not both, not neither).",
        )

    src_type = "ocr" if has_image else "text"

    if has_image:
        try:
            image_bytes = _decode_ocr_image(req.image_b64)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
                if "limit" in str(exc).lower()
                else status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        mime = req.mime or "image/jpeg"
        try:
            arabic_text = await run_in_threadpool(_call_ocr_space, image_bytes, mime)
        except ValueError as exc:
            err_msg = str(exc)
            if err_msg.startswith("ocr_empty:"):
                return {
                    "schema_version": 1,
                    "status": "ocr_empty",
                    "match_type": None,
                    "source": src_type,
                    "message": err_msg[len("ocr_empty:"):],
                    "recognized_text": "",
                    "ocr_confidence": None,
                    "confidence": None,
                }
            user_msg = err_msg[len("ocr_failed:"):] if err_msg.startswith("ocr_failed:") else err_msg
            return {
                "schema_version": 1,
                "status": "ocr_failed",
                "match_type": None,
                "source": src_type,
                "message": user_msg,
                "recognized_text": "",
                "ocr_confidence": None,
                "confidence": None,
            }
    else:
        arabic_text = req.arabic_text

    cleaned = _strip_diacritics(arabic_text.strip())
    try:
        match = await run_in_threadpool(
            find_best_match, cleaned, QURAN_IDENTIFY_OCR_MIN_CONFIDENCE
        )
    except NoConfidentMatchError as exc:
        return {
            "schema_version": 1,
            "status": "no_match",
            "match_type": None,
            "source": src_type,
            "message": str(exc),
            "recognized_text": arabic_text,
            "transcript": arabic_text,
            "extracted_text": arabic_text,
            "confidence": None,
            "ocr_confidence": None,
        }
    except CorpusUnavailableError as exc:
        logger.exception("Quran corpus unavailable for text identification")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The Quran text-matching service is not ready.",
        ) from exc

    if match.confidence < QURAN_IDENTIFY_OCR_MIN_CONFIDENCE:
        return {
            "schema_version": 1,
            "status": "no_match",
            "match_type": None,
            "source": src_type,
            "message": (
                f"The best match ({match.confidence:.0%}) was below the confidence threshold. "
                "No confident Quran-corpus match found."
            ),
            "recognized_text": arabic_text,
            "transcript": arabic_text,
            "extracted_text": arabic_text,
            "confidence": None,
            "ocr_confidence": None,
        }

    match_type_val = "exact" if match.confidence >= 0.95 else "partial"

    return {
        "schema_version": 1,
        "status": "success",
        "match_type": match_type_val,
        "source": src_type,
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
        "ocr_confidence": None,
        "matched_text_arabic": match.matched_text_arabic,
        "matched_text_english": match.matched_text_english,
        "recognized_text": arabic_text,
        "transcript": arabic_text,
        "extracted_text": arabic_text,
        "model_name": "text-fuzzy-match",
        "modelName": "text-fuzzy-match",
        "model_revision": "1.0",
        "modelRevision": "1.0",
        "matcher_version": "1.0.0",
        "processing_time_ms": 0,
        "processingTimeMs": 0,
    }


class HalalOcrRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    image_b64: str
    mime: Optional[str] = "image/jpeg"


def _call_ocr_space_eng(image_bytes: bytes, mime: str) -> str:
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

from fatawa_catalog import FATAWA_CATALOG, CATEGORIES, ALLOWED_SOURCE_HOSTS  # noqa: E402


def _validate_source_url(url: str, field: str = "source_url") -> str:
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        host = (parsed.hostname or "").lower().rstrip(".")
        if host.startswith("www."):
            host = host[4:]
    except Exception:
        raise HTTPException(status_code=422, detail=f"{field}: malformed URL '{url}'")
    if scheme != "https":
        raise HTTPException(
            status_code=422,
            detail=f"{field}: only HTTPS URLs are permitted (got scheme '{scheme}').",
        )
    if host not in ALLOWED_SOURCE_HOSTS:
        raise HTTPException(
            status_code=422,
            detail=f"{field}: host '{host}' is not on the approved allowlist.",
        )
    return url


class FatawaEvidenceCitation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: Literal["quran", "hadith", "fatwa", "tafsir"]
    reference: str
    url: Optional[str] = None
    verified: bool = False


class FatawaItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", protected_namespaces=())
    schema_version: int = 1
    id: str
    title: str
    question_summary: str
    excerpt_or_summary: str
    summary_author: Optional[str] = None
    category: str
    category_name_english: str
    category_name_arabic: str
    evidence_citations: list[FatawaEvidenceCitation] = []
    source_provider: str
    source_url: str
    source_reference: str
    scholar_or_author: Optional[str] = None
    reviewer_name_or_org: Optional[str] = None
    review_status: Literal["draft", "scholar_reviewed", "published"]
    differing_opinions_note: Optional[str] = None
    language: str = "en"
    madhhab_or_scope: Optional[str] = None
    license: Literal[
        "original_islamic_hikmah_summary",
        "licensed_content",
        "public_domain",
        "permission_required",
    ]
    rights_basis: Optional[str] = None
    published_at: Optional[str] = None
    reviewed_at: Optional[str] = None
    updated_at: Optional[str] = None
    catalog_version: int = 1
    content_version: int = 1


class FatawaCategoryResponse(BaseModel):
    id: str
    name_english: str
    name_arabic: str
    icon: str
    description: str
    count: int


class FatawaPaginatedResponse(BaseModel):
    total: int
    page: int
    limit: int
    results: list[FatawaItemResponse]


class FatawaErrorResponse(BaseModel):
    detail: str


def _normalize_arabic(text: str) -> str:
    diacritics = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed]")
    return diacritics.sub("", text)


_FATAWA_SEARCH_STOPWORDS = frozenset(
    {
        "a", "an", "the", "is", "it", "to", "of", "in", "on", "for", "and", "or",
        "do", "does", "can", "could", "should", "would", "i", "my", "me", "what",
        "how", "are", "if", "with", "was", "be", "this", "that", "there",
    }
)


def _fatawa_query_tokens(text: str) -> set[str]:
    words = re.findall(r"[\w']+", _normalize_arabic(text.lower()))
    return {
        word
        for word in words
        if word not in _FATAWA_SEARCH_STOPWORDS and len(word) > 1
    }


def _item_matches_query(item: dict, q: str) -> bool:
    q_norm = _normalize_arabic(q.lower())
    haystack = " ".join(
        str(item.get(field, "") or "")
        for field in ("title", "question_summary", "excerpt_or_summary", "scholar_or_author")
    )
    haystack_norm = _normalize_arabic(haystack.lower())

    if q_norm and q_norm in haystack_norm:
        return True

    query_tokens = _fatawa_query_tokens(q)
    if not query_tokens:
        return False

    overlap = query_tokens & _fatawa_query_tokens(haystack)
    required = (
        len(query_tokens)
        if len(query_tokens) <= 2
        else max(2, math.ceil(len(query_tokens) * 0.6))
    )
    return len(overlap) >= required


def _build_fatawa_response(item: dict) -> FatawaItemResponse:
    _validate_source_url(item["source_url"])
    for cit in item.get("evidence_citations", []):
        if cit.get("url"):
            _validate_source_url(cit["url"], field="evidence_citations[].url")
    return FatawaItemResponse(**item)


@api_router.get(
    "/fatawa/categories",
    response_model=list[FatawaCategoryResponse],
    tags=["fatawa"],
    summary="List Fatawa topic categories with item counts",
)
async def get_fatawa_categories():
    check_rate_limit("fatawa_categories:global", limit_per_min=60)
    return CATEGORIES


@api_router.get(
    "/fatawa/search",
    response_model=FatawaPaginatedResponse,
    tags=["fatawa"],
    summary="Search and filter Fatawa summaries",
)
async def search_fatawa(
    q: Optional[str] = Query(default=None, max_length=200),
    category: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    include_draft: bool = Query(default=False),
    request: Request = None,
    current_user: Optional[dict] = Depends(get_optional_user_profile),
):
    client_ip = _get_client_ip(request)
    check_rate_limit(f"fatawa_search:{client_ip}", limit_per_min=30)

    if include_draft and not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access draft content.",
        )

    results = list(FATAWA_CATALOG)

    if not include_draft:
        results = [r for r in results if r.get("review_status") == "published"]

    results = [r for r in results if r.get("license") != "permission_required"]

    if category:
        valid_category_ids = {c["id"] for c in CATEGORIES}
        if category not in valid_category_ids:
            raise HTTPException(
                status_code=422,
                detail=f"Unknown category '{category}'. Valid: {sorted(valid_category_ids)}",
            )
        results = [r for r in results if r.get("category") == category]

    if q and q.strip():
        q_clean = q.strip()
        results = [r for r in results if _item_matches_query(r, q_clean)]

    total = len(results)
    offset = (page - 1) * limit
    page_results = results[offset: offset + limit]

    return FatawaPaginatedResponse(
        total=total,
        page=page,
        limit=limit,
        results=[_build_fatawa_response(item) for item in page_results],
    )


SERPAPI_API_KEY = os.environ.get("SERPAPI_API_KEY", "").strip()


def _is_islamqa_answer_url(value: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(value)
    except Exception:
        return False
    host = (parsed.hostname or "").lower().rstrip(".")
    if host.startswith("www."):
        host = host[4:]
    return (
        parsed.scheme.lower() == "https"
        and host == "islamqa.info"
        and re.search(r"/(?:[a-z]{2}/)?answers/\d+(?:/|$)", parsed.path, re.IGNORECASE)
        is not None
    )


async def _search_islamqa_for_url(query: str) -> Optional[str]:
    if not SERPAPI_API_KEY:
        return None

    params = urllib.parse.urlencode(
        {
            "engine": "google",
            "q": f"site:islamqa.info {query}",
            "num": 5,
            "api_key": SERPAPI_API_KEY,
        }
    )
    search_url = f"https://serpapi.com/search.json?{params}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                search_url,
                headers={"User-Agent": "IslamicHikmahApp/1.0"},
                timeout=6.0,
            )
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.warning("IslamQA site search failed for query %r: %s", query, exc)
        return None

    query_tokens = _fatawa_query_tokens(query)
    for result in payload.get("organic_results") or []:
        link = result.get("link")
        result_text = f"{result.get('title', '')} {result.get('snippet', '')}"
        result_tokens = _fatawa_query_tokens(result_text)
        overlap = query_tokens & result_tokens
        required = 1 if len(query_tokens) <= 3 else max(2, math.ceil(len(query_tokens) * 0.35))
        if (
            isinstance(link, str)
            and _is_islamqa_answer_url(link)
            and bool(query_tokens)
            and len(overlap) >= required
        ):
            return link
    return None


def _json_ld_objects(payload: object) -> list[dict]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    objects = [payload]
    graph = payload.get("@graph")
    if isinstance(graph, list):
        objects.extend(item for item in graph if isinstance(item, dict))
    return objects


async def _fetch_islamqa_answer(url: str) -> Optional[dict]:
    if not _is_islamqa_answer_url(url):
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                    )
                },
                timeout=6.0,
            )
            response.raise_for_status()
            page_html = response.text
    except Exception as exc:
        logger.warning("Live fetch from IslamQA failed for %s: %s", url, exc)
        return None

    blocks = re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        page_html,
        re.DOTALL | re.IGNORECASE,
    )
    for block in blocks:
        try:
            payload = json.loads(block)
        except (TypeError, ValueError):
            continue
        for data in _json_ld_objects(payload):
            if data.get("@type") != "QAPage" and "mainEntity" not in data:
                continue
            entity = data.get("mainEntity") or {}
            if not isinstance(entity, dict):
                continue
            answer_data = entity.get("acceptedAnswer")
            if not isinstance(answer_data, dict):
                suggested = entity.get("suggestedAnswer") or []
                answer_data = suggested[0] if isinstance(suggested, list) and suggested else {}
            if not isinstance(answer_data, dict):
                continue
            answer_text = answer_data.get("text") or ""
            clean_answer = html.unescape(re.sub(r"<[^>]+>", "", str(answer_text)))
            clean_answer = re.sub(r"\s+", " ", clean_answer).strip()
            title = html.unescape(str(entity.get("name") or "")).strip()
            if title or clean_answer:
                return {"title": title, "answer_text": clean_answer}
    return None


async def _synthesize_question_ruling(q: str) -> Optional[dict]:
    matched_url = await _search_islamqa_for_url(q)
    fetched = await _fetch_islamqa_answer(matched_url) if matched_url else None
    if not fetched:
        return None

    title = fetched["title"] or f"Scholarly Answer: {q[:70]}"
    clean_answer = fetched["answer_text"]
    if not clean_answer:
        return None
    summary = clean_answer[:400] + "..." if len(clean_answer) > 400 else clean_answer
    answer_id_match = re.search(r"/answers/(\d+)", matched_url)
    source_reference = (
        f"IslamQA.info Answer #{answer_id_match.group(1)}"
        if answer_id_match
        else "IslamQA.info scholarly answer"
    )
    citations = [
        {
            "type": "fatwa",
            "reference": source_reference,
            "url": matched_url,
            "verified": False,
        }
    ]
    q_hash = hashlib.sha256(q.encode("utf-8")).hexdigest()[:8]
    q_lower = q.lower()

    if any(k in q_lower for k in ("pray", "salah", "fast", "ramadan", "zakat", "hajj", "wudu", "cap", "shirt")):
        category = "worship"
        cat_en = "Worship (Ibadah)"
        cat_ar = "العبادة"
    elif any(k in q_lower for k in ("interest", "riba", "loan", "bank", "stock", "trade", "crypto")):
        category = "transactions"
        cat_en = "Business & Transactions"
        cat_ar = "المعاملات"
    elif any(k in q_lower for k in ("food", "eat", "halal", "pork", "meat", "seafood", "gelatin")):
        category = "food_ethics"
        cat_en = "Food & Ethics"
        cat_ar = "الطعام والآداب"
    elif any(k in q_lower for k in ("marry", "marriage", "nikah", "divorce", "spouse")):
        category = "family"
        cat_en = "Family & Marriage"
        cat_ar = "الأسرة والزواج"
    else:
        category = "aqeedah"
        cat_en = "General Islamic Ruling"
        cat_ar = "فتوى شرعية"

    return {
        "schema_version": 1,
        "id": f"ask-live-{q_hash}",
        "title": title,
        "question_summary": q,
        "excerpt_or_summary": summary,
        "summary_author": "IslamQA.info source excerpt",
        "category": category,
        "category_name_english": cat_en,
        "category_name_arabic": cat_ar,
        "evidence_citations": citations,
        "source_provider": "IslamQA.info",
        "source_url": matched_url,
        "source_reference": source_reference,
        "scholar_or_author": "IslamQA.info Scholarly Team",
        "reviewer_name_or_org": None,
        "review_status": "draft",
        "reviewed_at": None,
        "language": "en",
        "madhhab_or_scope": "General Islamic Jurisprudence",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Live fetched summary excerpt from canonical IslamQA.info source",
        "published_at": None,
        "catalog_version": 1,
        "content_version": 1,
    }


class FatawaAskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)


@api_router.post(
    "/fatawa/ask",
    response_model=FatawaItemResponse,
    tags=["fatawa"],
    summary="Ask any custom Islamic question and receive a grounded ruling summary",
    responses={404: {"model": FatawaErrorResponse}},
)
async def ask_fatawa_question(
    body: FatawaAskRequest,
    request: Request = None,
):
    client_ip = _get_client_ip(request)
    check_rate_limit(f"fatawa_ask:{client_ip}", limit_per_min=20)

    q = body.question.strip()
    if not q:
        raise HTTPException(status_code=422, detail="Question cannot be empty.")

    for item in FATAWA_CATALOG:
        if item.get("review_status") == "published" and _item_matches_query(item, q):
            return _build_fatawa_response(item)

    dynamic_item = await _synthesize_question_ruling(q)
    if dynamic_item is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "We couldn't find a specific ruling for that question yet. "
                "Try rephrasing it, or browse a category below."
            ),
        )
    return _build_fatawa_response(dynamic_item)



@api_router.get(
    "/fatawa/{fatawa_id}",
    response_model=FatawaItemResponse,
    responses={404: {"model": FatawaErrorResponse}},
    tags=["fatawa"],
    summary="Fetch a single Fatawa summary by ID",
)
async def get_fatawa_by_id(
    fatawa_id: str,
    request: Request = None,
):
    client_ip = _get_client_ip(request)
    check_rate_limit(f"fatawa_detail:{client_ip}", limit_per_min=30)

    if not re.fullmatch(r"[a-z0-9\-]+", fatawa_id):
        raise HTTPException(status_code=422, detail="Invalid fatawa ID format.")

    for item in FATAWA_CATALOG:
        if item.get("id") == fatawa_id:
            if item.get("license") == "permission_required":
                raise HTTPException(
                    status_code=403,
                    detail="This content requires redistribution permission and is not yet available.",
                )
            return _build_fatawa_response(item)

    raise HTTPException(status_code=404, detail=f"Fatawa '{fatawa_id}' not found.")


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
        logger.error("Quran ASR preload failed: %s", exc)


@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        client.close()
    except Exception:
        pass
