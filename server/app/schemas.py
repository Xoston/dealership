from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re

# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Пароль должен содержать не менее 8 символов")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну букву")
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    role: str
    full_name: Optional[str]
    phone: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# ---------- Cars ----------
class CarImageOut(BaseModel):
    id: int
    car_id: int
    image_url: str

    model_config = {"from_attributes": True}

class CarBase(BaseModel):
    brand: str
    model: str
    year: int
    price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    body_type: str = "sedan"
    restyling: bool = False
    engine_volume: Optional[float] = None
    power: Optional[int] = None
    fuel_type: Optional[str] = None
    consumption: Optional[float] = None
    drive_type: Optional[str] = None
    transmission: Optional[str] = None
    acceleration: Optional[float] = None
    max_speed: Optional[int] = None
    clearance: Optional[int] = None
    seats: Optional[int] = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be positive")
        return v

class CarCreate(CarBase):
    pass

class CarUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    body_type: Optional[str] = None
    restyling: Optional[bool] = None
    engine_volume: Optional[float] = None
    power: Optional[int] = None
    fuel_type: Optional[str] = None
    consumption: Optional[float] = None
    drive_type: Optional[str] = None
    transmission: Optional[str] = None
    acceleration: Optional[float] = None
    max_speed: Optional[int] = None
    clearance: Optional[int] = None
    seats: Optional[int] = None

class CarOut(CarBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    images: list[CarImageOut] = []

    model_config = {"from_attributes": True}

# ---------- Loans ----------
class LoanCalculateRequest(BaseModel):
    car_id: int
    amount: float
    term_months: int
    interest_rate: float

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class LoanCalculateResponse(BaseModel):
    monthly_payment: float
    total_payment: float
    overpayment: float
    schedule: list[dict]

class LoanApplicationOut(BaseModel):
    id: int
    car_id: int
    amount: float
    term_months: int
    interest_rate: float
    monthly_payment: float
    total_payment: float
    overpayment: float
    status: str
    created_at: datetime
    admin_comment: Optional[str] = None  # РАСКОММЕНТИРОВАНО: теперь комментарии будут приходить на фронтенд

    model_config = {"from_attributes": True}

# ---------- Test Drive ----------
class TestDriveRequestCreate(BaseModel):
    car_id: int
    preferred_date: str
    phone: str
    message: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if not v.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise ValueError("Phone must contain only digits, +, -, spaces")
        return v

class TestDriveRequestOut(BaseModel):
    id: int
    user_id: int
    car_id: int
    preferred_date: datetime
    phone: str
    message: Optional[str] = None
    status: str
    created_at: datetime
    admin_comment: Optional[str] = None

    model_config = {"from_attributes": True}