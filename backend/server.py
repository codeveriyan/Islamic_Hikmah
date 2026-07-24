from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with environment fallback
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'islamic_hikmah')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# In-memory database fallback if MongoDB is not running/available
IN_MEMORY_DB = {
    "users": {},
    "sessions": {},
    "status_checks": []
}

# Logger setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security config
SECRET_KEY = os.environ.get("JWT_SECRET", "supersecretkeyforislamichikmahauth12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Pydantic Schemas
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginInput(BaseModel):
    provider_id: str
    email: str
    name: str
    profile_image: Optional[str] = None

class ForgotPasswordInput(BaseModel):
    email: str

class ResetPasswordInput(BaseModel):
    token: str
    new_password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    profile_image: Optional[str] = None
    status: Optional[str] = None

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

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    profile: UserProfileResponse

# Status check model
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Helper functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_jwt_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Database check & query helpers with fallback
async def db_find_user_by_email(email: str):
    try:
        # Check connection status quickly (timeout in 1 second)
        user = await db.users.find_one({"email": email})
        return user
    except Exception as e:
        logger.warning(f"MongoDB search failed, falling back to memory database. Error: {e}")
        return IN_MEMORY_DB["users"].get(email.lower())

async def db_insert_user(user_dict: dict):
    try:
        await db.users.insert_one(user_dict)
    except Exception as e:
        logger.warning(f"MongoDB insert failed, falling back to memory database. Error: {e}")
        IN_MEMORY_DB["users"][user_dict["email"].lower()] = user_dict

async def db_update_user(email: str, update_dict: dict):
    try:
        await db.users.update_one({"email": email}, {"$set": update_dict})
    except Exception as e:
        logger.warning(f"MongoDB update failed, falling back to memory database. Error: {e}")
        user = IN_MEMORY_DB["users"].get(email.lower())
        if user:
            user.update(update_dict)

# Cache of Google public certificates for Firebase ID Token verification
GOOGLE_CERTS = {}
GOOGLE_CERTS_EXPIRE = datetime.min

def get_google_public_key(kid: str) -> Optional[str]:
    global GOOGLE_CERTS, GOOGLE_CERTS_EXPIRE
    now = datetime.utcnow()
    if not GOOGLE_CERTS or now > GOOGLE_CERTS_EXPIRE:
        try:
            res = requests.get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com", timeout=10)
            if res.status_code == 200:
                GOOGLE_CERTS = res.json()
                cc = res.headers.get("Cache-Control", "")
                max_age = 3600
                for part in cc.split(","):
                    if "max-age" in part:
                        try:
                            max_age = int(part.split("=")[1].strip())
                        except Exception:
                            pass
                GOOGLE_CERTS_EXPIRE = now + timedelta(seconds=max_age)
        except Exception as e:
            logger.warning(f"Failed to fetch Google public certificates: {e}")
    
    return GOOGLE_CERTS.get(kid)

# JWT Verification Dependency
async def get_current_user_profile(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_411_LENGTH_REQUIRED if not authorization else status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    token = authorization.split(" ")[1]
    
    # Try decoding backend-issued JWT first
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        user = await db_find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except jwt.InvalidTokenError:
        # Fallback to Firebase ID Token validation
        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            if not kid:
                raise jwt.InvalidTokenError("No kid in header")
                
            public_key_pem = get_google_public_key(kid)
            if not public_key_pem:
                raise jwt.InvalidTokenError("Matching public key not found")
                
            decoded = jwt.decode(
                token,
                public_key_pem,
                algorithms=["RS256"],
                audience="islamic-hikmah",
                issuer="https://securetoken.google.com/islamic-hikmah"
            )
            
            email = decoded.get("email")
            uid = decoded.get("user_id") or decoded.get("sub")
            if not email:
                raise jwt.InvalidTokenError("Email not present in token")
                
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
                    "trial_ends_at": None
                }
                await db_insert_user(user)
            return user
        except Exception as e:
            logger.warning(f"Firebase token validation fallback failed: {e}")
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

@api_router.post("/hadith/{collection}/backfill")
def backfill_sunnah_collection(
    collection: str,
    limit: int = Query(100, ge=1, le=100),
):
    """Download every available page for one Sunnah.com collection into disk cache."""
    if collection not in SUNNAH_COLLECTIONS:
        raise HTTPException(status_code=404, detail="This collection is not available from Sunnah.com.")

    page = 1
    total_pages = 0
    total_hadith = 0
    while page:
        payload = fetch_sunnah_page(collection, page, limit)
        write_sunnah_cache(collection, page, limit, payload)
        total_pages += 1
        total_hadith += len(payload.get("data", []))
        page = payload.get("next") or 0

    return {
        "collection": collection,
        "pages_cached": total_pages,
        "hadith_cached": total_hadith,
        "cache_dir": str(SUNNAH_CACHE_DIR),
    }

# POST /signup
@api_router.post("/signup", response_model=TokenResponse)
async def signup(user_in: UserCreate):
    existing_user = await db_find_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    user_id = str(uuid.uuid4())
    now = datetime.utcnow()
    user_dict = {
        "id": user_id,
        "name": user_in.name,
        "email": user_in.email.lower(),
        "password_hash": hash_password(user_in.password),
        "profile_image": None,
        "provider": "email",
        "provider_id": None,
        "email_verified": False,
        "created_at": now,
        "updated_at": now,
        "last_login": now,
        "status": "Active",
        "tier": "free",
        "trial_started_at": None,
        "trial_active": False,
        "trial_ends_at": None
    }

    await db_insert_user(user_dict)

    # Generate JWT Tokens
    access_token = create_jwt_token({"sub": user_dict["email"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_jwt_token({"sub": user_dict["email"]}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "profile": user_dict
    }

# POST /login
@api_router.post("/login", response_model=TokenResponse)
async def login(user_in: UserLogin):
    user = await db_find_user_by_email(user_in.email)
    if not user or not verify_password(user_in.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )
    
    if user.get("status") == "Blocked":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been blocked.")

    now = datetime.utcnow()
    await db_update_user(user["email"], {"last_login": now})
    user["last_login"] = now

    # Generate JWT Tokens
    access_token = create_jwt_token({"sub": user["email"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_jwt_token({"sub": user["email"]}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "profile": user
    }

# POST /google-login
@api_router.post("/google-login", response_model=TokenResponse)
async def google_login(google_in: GoogleLoginInput):
    user = await db_find_user_by_email(google_in.email)
    now = datetime.utcnow()

    if not user:
        # Create Google sign-in user automatically
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": google_in.name,
            "email": google_in.email.lower(),
            "password_hash": "",
            "profile_image": google_in.profile_image,
            "provider": "google",
            "provider_id": google_in.provider_id,
            "email_verified": True,
            "created_at": now,
            "updated_at": now,
            "last_login": now,
            "status": "Active",
            "tier": "free",
            "trial_started_at": None,
            "trial_active": False,
            "trial_ends_at": None
        }
        await db_insert_user(user)
    else:
        # Update login times
        update_data = {
            "last_login": now,
            "provider": "google",
            "provider_id": google_in.provider_id
        }
        if google_in.profile_image:
            update_data["profile_image"] = google_in.profile_image
        
        await db_update_user(user["email"], update_data)
        user.update(update_data)

    if user.get("status") == "Blocked":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account has been blocked.")

    # Generate JWT Tokens
    access_token = create_jwt_token({"sub": user["email"]}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_jwt_token({"sub": user["email"]}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "profile": user
    }

# POST /logout
@api_router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user_profile)):
    # In a full production app, you would add the active token to a redis blacklist
    return {"message": "Successfully logged out from session."}

# POST /forgot-password
@api_router.post("/forgot-password")
async def forgot_password(forgot_in: ForgotPasswordInput):
    user = await db_find_user_by_email(forgot_in.email)
    if not user:
        # Avoid user enumeration attacks: return success anyway but log internally
        logger.info(f"Password reset requested for non-existent email: {forgot_in.email}")
        return {"message": "If the account exists, a reset link has been dispatched."}
    
    # Generate password reset token
    reset_token = create_jwt_token({"sub": user["email"], "purpose": "reset"}, timedelta(hours=1))
    logger.info(f"Password reset token generated: {reset_token}")
    return {"message": "If the account exists, a reset link has been dispatched.", "mock_link_token": reset_token}

# POST /reset-password
@api_router.post("/reset-password")
async def reset_password(reset_in: ResetPasswordInput):
    try:
        payload = jwt.decode(reset_in.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token purpose")
        email = payload.get("sub")
        user = await db_find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Update password
        new_hash = hash_password(reset_in.new_password)
        await db_update_user(email, {"password_hash": new_hash, "updated_at": datetime.utcnow()})
        return {"message": "Password has been successfully updated."}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset link token.")

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
    if profile_in.status is not None:
        update_data["status"] = profile_in.status

    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db_update_user(current_user["email"], update_data)
        current_user.update(update_data)

    return check_and_update_trial_status(current_user)

class UtrVerifyInput(BaseModel):
    utr: str
    plan: str
    amount: float

# POST /verify-utr
@api_router.post("/verify-utr")
async def verify_utr(verify_in: UtrVerifyInput, current_user: dict = Depends(get_current_user_profile)):
    clean_utr = verify_in.utr.strip()
    if not clean_utr.isdigit() or len(clean_utr) != 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UTR. The transaction ID must be a 12-digit number."
        )
    
    # Simulate processing with a payment gateway (e.g. check UPI settlement records)
    # Approve any 12-digit UTR not starting with '0000'
    if clean_utr.startswith("0000"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Transaction declined by payment gateway or UTR not found."
        )

    now = datetime.utcnow()
    update_data = {
        "tier": "premium",
        "updated_at": now
    }
    
    payment_record = {
        "utr": clean_utr,
        "user_email": current_user["email"],
        "plan": verify_in.plan,
        "amount": verify_in.amount,
        "status": "verified",
        "verified_at": now
    }
    
    try:
        await db.payments.insert_one(payment_record)
    except Exception:
        if "payments" not in IN_MEMORY_DB:
            IN_MEMORY_DB["payments"] = {}
        IN_MEMORY_DB["payments"][clean_utr] = payment_record

    await db_update_user(current_user["email"], update_data)
    current_user.update(update_data)
    
    profile_cleaned = check_and_update_trial_status(current_user).copy()
    profile_cleaned.pop("_id", None)
    
    return {
        "status": "success",
        "message": "Payment verified successfully. Premium tier unlocked!",
        "profile": profile_cleaned
    }

# POST /start-trial
@api_router.post("/start-trial")
async def start_trial_backend(current_user: dict = Depends(get_current_user_profile)):
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


# Original Status Checks endpoints
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    try:
        _ = await db.status_checks.insert_one(status_obj.dict())
    except Exception:
        IN_MEMORY_DB["status_checks"].append(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    try:
        status_checks = await db.status_checks.find().to_list(1000)
        return [StatusCheck(**status_check) for status_check in status_checks]
    except Exception:
        return [StatusCheck(**status_check) for status_check in IN_MEMORY_DB["status_checks"]]


# Include routes & CORS middleware configuration
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        client.close()
    except Exception:
        pass
