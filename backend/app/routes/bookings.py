from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Booking, User, BookingStatus
from ..schemas import BookingCreate, BookingOut
from ..notifier import notify_booking_created, notify_booking_cancelled
import asyncio

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/{telegram_id}", response_model=BookingOut)
async def create_booking(telegram_id: int, data: BookingCreate, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        raise HTTPException(404, "User not found")

    booking = Booking(
        user_id=user.id,
        studio_id=data.studio_id,
        service_id=data.service_id,
        service_title=data.service_title,
        duration_hours=data.duration_hours,
        booking_date=data.booking_date,
        booking_time=data.booking_time,
        total_price=data.total_price,
        prepay_amount=data.prepay_amount,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    # Fire-and-forget admin alert
    asyncio.create_task(notify_booking_created(booking, user))

    return booking


@router.get("/{telegram_id}", response_model=list[BookingOut])
async def get_user_bookings(telegram_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        return []
    result = await db.scalars(
        select(Booking).where(Booking.user_id == user.id).order_by(Booking.created_at.desc())
    )
    return result.all()


@router.patch("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status not in (BookingStatus.pending, BookingStatus.confirmed):
        raise HTTPException(400, "Cannot cancel this booking")

    booking.status = BookingStatus.cancelled
    await db.commit()
    await db.refresh(booking)

    user = await db.get(User, booking.user_id)
    asyncio.create_task(notify_booking_cancelled(booking, user))

    return booking


@router.get("/admin/all", response_model=list[BookingOut])
async def admin_all_bookings(date: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Booking).order_by(Booking.booking_date, Booking.booking_time)
    if date:
        query = query.where(Booking.booking_date == date)
    result = await db.scalars(query)
    return result.all()
