from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from ..database import get_db
from ..models import User
from ..notifier import broadcast as do_broadcast
import os

router = APIRouter(prefix="/broadcast", tags=["broadcast"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me-in-production")


class BroadcastRequest(BaseModel):
    message: str
    preview: bool = False   # если True — только считает юзеров, не отправляет


@router.post("")
async def send_broadcast(
    body: BroadcastRequest,
    x_admin_secret: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")

    users = await db.scalars(select(User))
    user_ids = [u.telegram_id for u in users]

    if body.preview:
        return {"total_users": len(user_ids), "message_preview": body.message}

    results = await do_broadcast(user_ids, body.message)
    return {"total": len(user_ids), **results}


@router.get("/stats")
async def get_stats(x_admin_secret: str = Header(...), db: AsyncSession = Depends(get_db)):
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")

    from ..models import Booking, BookingStatus
    from sqlalchemy import func

    total_users = await db.scalar(select(func.count()).select_from(User))
    total_bookings = await db.scalar(select(func.count()).select_from(Booking))
    active_bookings = await db.scalar(
        select(func.count()).select_from(Booking).where(
            Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed])
        )
    )
    return {
        "total_users": total_users,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
    }
