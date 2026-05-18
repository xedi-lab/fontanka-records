from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .models import BookingStatus


class UserCreate(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None


class UserOut(BaseModel):
    id: int
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class BookingCreate(BaseModel):
    studio_id: str
    service_id: str
    service_title: str
    duration_hours: int
    booking_date: str
    booking_time: str
    total_price: float
    prepay_amount: float


class BookingOut(BaseModel):
    id: int
    user_id: int
    studio_id: str
    service_id: str
    service_title: str
    duration_hours: int
    booking_date: str
    booking_time: str
    total_price: float
    prepay_amount: float
    status: BookingStatus
    created_at: datetime

    class Config:
        orm_mode = True


class TelegramAuth(BaseModel):
    init_data: str
