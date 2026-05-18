from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Booking, BookingStatus

router = APIRouter(prefix="/slots", tags=["slots"])

ALL_SLOTS = [
    "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00",
    "20:00", "21:00", "22:00",
]


@router.get("/{studio_id}/{date}")
async def get_available_slots(studio_id: str, date: str, db: AsyncSession = Depends(get_db)):
    booked = await db.scalars(
        select(Booking).where(
            Booking.studio_id == studio_id.upper(),
            Booking.booking_date == date,
            Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed]),
        )
    )
    booked_times = {b.booking_time for b in booked}

    slots = [
        {"time": t, "available": t not in booked_times}
        for t in ALL_SLOTS
    ]
    return {"date": date, "studio_id": studio_id, "slots": slots}
