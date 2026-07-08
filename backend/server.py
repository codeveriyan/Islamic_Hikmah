from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt

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

# JWT Verification Dependency
async def get_current_user_profile(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_411_LENGTH_REQUIRED if not authorization else status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    token = authorization.split(" ")[1]
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# FastAPI application initialization
app = FastAPI(title="Islamic Hikmah Authentication Backend")
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "Welcome to Islamic Hikmah Authentication API!"}

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
        "status": "Active"
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
            "status": "Active"
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

# GET /profile
@api_router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user_profile)):
    return current_user

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

    return current_user


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
