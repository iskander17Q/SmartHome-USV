import sqlite3
import jwt
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import Depends, FastAPI, HTTPException, Request
import bcrypt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import os
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATABASE = "smart_home.db"
SECRET_KEY = os.getenv("JWT_SECRET", "very_secret_key_for_local_dev")
ALGORITHM = "HS256"
EXPIRATION_DAYS = 7

security = HTTPBearer()

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

def initialize_db():
    conn = sqlite3.connect(DATABASE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT DEFAULT '',
            last_name TEXT DEFAULT ''
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            status INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DATABASE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys = ON")
        yield conn
    finally:
        conn.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_db()
    yield

# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------

app = FastAPI(title="Smart Home API", version="1.0.0", lifespan=lifespan)

# Setup CORS identically to JS project
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://localhost:30080").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    email: str = Field(min_length=5, max_length=100)
    password: str = Field(min_length=6, max_length=100)
    firstName: Optional[str] = ""
    lastName: Optional[str] = ""

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address format.")
        return v.lower()

class UserLogin(BaseModel):
    email: str
    password: str

class DeviceCreate(BaseModel):
    name: str = Field(min_length=1)
    icon: str = Field(min_length=1)
    status: bool = False

class DeviceUpdate(BaseModel):
    status: bool

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=EXPIRATION_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: sqlite3.Connection = Depends(get_db)
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid token payload")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Unauthorized: Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid token")

    user = db.execute(
        "SELECT id, email, first_name, last_name FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: User not found")
        
    return dict(user)

# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/register", status_code=201)
def register(user_data: UserRegister, db: sqlite3.Connection = Depends(get_db)):
    existing = db.execute(
        "SELECT id FROM users WHERE email = ?", (user_data.email,)
    ).fetchone()
    
    if existing:
        raise HTTPException(status_code=400, detail={"error": "Email already exists"})

    cursor = db.execute(
        "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)",
        (user_data.email, hash_password(user_data.password), user_data.firstName, user_data.lastName)
    )
    db.commit()
    
    new_user_id = cursor.lastrowid
    user_dict = {
        "id": new_user_id,
        "email": user_data.email,
        "first_name": user_data.firstName,
        "last_name": user_data.lastName
    }
    
    token = create_token({"id": new_user_id, "email": user_data.email})
    
    return {"token": token, "user": user_dict}

@app.post("/auth/login")
def login(user_data: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    user = db.execute(
        "SELECT * FROM users WHERE email = ?", (user_data.email.lower(),)
    ).fetchone()
    
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail={"error": "Invalid email or password"})
        
    user_dict = {
        "id": user["id"],
        "email": user["email"],
        "first_name": user["first_name"],
        "last_name": user["last_name"]
    }
    
    token = create_token({"id": user["id"], "email": user["email"]})
    return {"token": token, "user": user_dict}

@app.get("/auth/me")
def get_me(current_user=Depends(get_current_user)):
    return {"user": current_user}

# ---------------------------------------------------------------------------
# Device Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/devices")
def get_devices(db: sqlite3.Connection = Depends(get_db), current_user=Depends(get_current_user)):
    devices = db.execute(
        "SELECT * FROM devices WHERE user_id = ? ORDER BY id DESC", (current_user["id"],)
    ).fetchall()
    
    # Map status to boolean
    return [{**dict(d), "status": bool(d["status"])} for d in devices]

@app.post("/api/devices", status_code=201)
def create_device(device_data: DeviceCreate, db: sqlite3.Connection = Depends(get_db), current_user=Depends(get_current_user)):
    cursor = db.execute(
        "INSERT INTO devices (user_id, name, icon, status) VALUES (?, ?, ?, ?)",
        (current_user["id"], device_data.name, device_data.icon, int(device_data.status))
    )
    db.commit()
    
    new_device = db.execute("SELECT * FROM devices WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return {**dict(new_device), "status": bool(new_device["status"])}

@app.patch("/api/devices/{device_id}")
def update_device(device_id: int, device_data: DeviceUpdate, db: sqlite3.Connection = Depends(get_db), current_user=Depends(get_current_user)):
    # Check if device exists and belongs to user
    device = db.execute(
        "SELECT * FROM devices WHERE id = ? AND user_id = ?", (device_id, current_user["id"])
    ).fetchone()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
        
    db.execute(
        "UPDATE devices SET status = ? WHERE id = ?",
        (int(device_data.status), device_id)
    )
    db.commit()
    
    updated_device = db.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).fetchone()
    return {**dict(updated_device), "status": bool(updated_device["status"])}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 3001)), reload=True)
