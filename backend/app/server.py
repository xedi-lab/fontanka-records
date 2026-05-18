import os
import enum
import asyncio
from datetime import datetime, date
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Enum as SAEnum, ForeignKey, func
from sqlalchemy.orm import DeclarativeBase, relationship, Session
from dotenv import load_dotenv
import httpx

load_dotenv()

app = Flask(__name__)
CORS(app)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fontanka.db").replace(
    "sqlite+aiosqlite", "sqlite"
)
BOT_TOKEN   = os.getenv("BOT_TOKEN", "")
ADMIN_IDS   = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me")
TG_API      = f"https://api.telegram.org/bot{BOT_TOKEN}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class Base(DeclarativeBase):
    pass


class BookingStatus(str, enum.Enum):
    pending   = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


class User(Base):
    __tablename__ = "users"
    id          = Column(Integer, primary_key=True)
    telegram_id = Column(Integer, unique=True, index=True)
    first_name  = Column(String(100))
    last_name   = Column(String(100), nullable=True)
    username    = Column(String(100), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    bookings    = relationship("Booking", back_populates="user")


class Booking(Base):
    __tablename__ = "bookings"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    user_id        = Column(Integer, ForeignKey("users.id"))
    studio_id      = Column(String(1))
    service_id     = Column(String(20))
    service_title  = Column(String(100))
    duration_hours = Column(Integer)
    booking_date   = Column(String(20))
    booking_time   = Column(String(5))
    total_price    = Column(Float)
    prepay_amount  = Column(Float)
    status         = Column(SAEnum(BookingStatus), default=BookingStatus.pending)
    created_at     = Column(DateTime, default=datetime.utcnow)
    user           = relationship("User", back_populates="bookings")


Base.metadata.create_all(engine)


def db():
    return Session(engine)


def booking_dict(b):
    return {
        "id": b.id, "user_id": b.user_id,
        "studio_id": b.studio_id, "service_id": b.service_id,
        "service_title": b.service_title, "duration_hours": b.duration_hours,
        "booking_date": b.booking_date, "booking_time": b.booking_time,
        "total_price": b.total_price, "prepay_amount": b.prepay_amount,
        "status": b.status.value, "created_at": b.created_at.isoformat(),
    }


def tg_send(chat_id, text):
    try:
        httpx.post(f"{TG_API}/sendMessage", json={
            "chat_id": chat_id, "text": text, "parse_mode": "HTML"
        }, timeout=5)
    except Exception:
        pass


def notify_admins(text):
    for aid in ADMIN_IDS:
        tg_send(aid, text)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


# ── Users ─────────────────────────────────────────────────────────────────────

@app.post("/api/users/upsert")
def upsert_user():
    data = request.json
    with db() as s:
        user = s.query(User).filter_by(telegram_id=data["telegram_id"]).first()
        if not user:
            user = User(**data)
            s.add(user)
        else:
            user.first_name = data["first_name"]
            user.last_name  = data.get("last_name")
            user.username   = data.get("username")
        s.commit()
        return jsonify({"id": user.id, "telegram_id": user.telegram_id,
                        "first_name": user.first_name})


# ── Bookings ──────────────────────────────────────────────────────────────────

@app.post("/api/bookings/<int:telegram_id>")
def create_booking(telegram_id):
    data = request.json
    with db() as s:
        user = s.query(User).filter_by(telegram_id=telegram_id).first()
        if not user:
            abort(404, "User not found")
        b = Booking(user_id=user.id, **data)
        s.add(b)
        s.commit()

        name = f"{user.first_name} {user.last_name or ''}".strip()
        uname = f" (@{user.username})" if user.username else ""
        notify_admins(
            f"🆕 <b>Новая запись!</b>\n\n"
            f"👤 {name}{uname}\n"
            f"🏠 Студия {b.studio_id} · Гороховая 70\n"
            f"🎛️ {b.service_title}\n"
            f"📅 {b.booking_date} в {b.booking_time}\n\n"
            f"💰 Итого: <b>{int(b.total_price):,} ₽</b>\n"
            f"💳 Предоплата: <b>{int(b.prepay_amount):,} ₽</b>\n"
            f"🆔 ID: #{b.id}"
        )
        return jsonify(booking_dict(b)), 201


@app.get("/api/bookings/<int:telegram_id>")
def get_bookings(telegram_id):
    with db() as s:
        user = s.query(User).filter_by(telegram_id=telegram_id).first()
        if not user:
            return jsonify([])
        bookings = s.query(Booking).filter_by(user_id=user.id)\
                    .order_by(Booking.created_at.desc()).all()
        return jsonify([booking_dict(b) for b in bookings])


@app.patch("/api/bookings/<int:booking_id>/cancel")
def cancel_booking(booking_id):
    with db() as s:
        b = s.get(Booking, booking_id)
        if not b:
            abort(404, "Not found")
        if b.status not in (BookingStatus.pending, BookingStatus.confirmed):
            abort(400, "Cannot cancel")
        b.status = BookingStatus.cancelled
        s.commit()
        user = s.get(User, b.user_id)
        name = f"{user.first_name} {user.last_name or ''}".strip() if user else "?"
        uname = f" (@{user.username})" if user and user.username else ""
        notify_admins(
            f"❌ <b>Запись отменена</b>\n\n"
            f"👤 {name}{uname}\n"
            f"🏠 Студия {b.studio_id} · {b.booking_date} в {b.booking_time}\n"
            f"🆔 ID: #{b.id}"
        )
        return jsonify(booking_dict(b))


@app.get("/api/bookings/admin/all")
def admin_bookings():
    day = request.args.get("date")
    with db() as s:
        q = s.query(Booking).order_by(Booking.booking_date, Booking.booking_time)
        if day:
            q = q.filter_by(booking_date=day)
        return jsonify([booking_dict(b) for b in q.all()])


# ── Slots ─────────────────────────────────────────────────────────────────────

ALL_SLOTS = ["10:00","11:00","12:00","13:00","14:00","15:00",
             "16:00","17:00","18:00","19:00","20:00","21:00","22:00"]


@app.get("/api/slots/<studio_id>/<day>")
def get_slots(studio_id, day):
    with db() as s:
        booked = s.query(Booking.booking_time).filter(
            Booking.studio_id == studio_id.upper(),
            Booking.booking_date == day,
            Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed])
        ).all()
        booked_times = {r[0] for r in booked}
        slots = [{"time": t, "available": t not in booked_times} for t in ALL_SLOTS]
        return jsonify({"date": day, "studio_id": studio_id, "slots": slots})


# ── Broadcast ─────────────────────────────────────────────────────────────────

def check_secret():
    if request.headers.get("x-admin-secret") != ADMIN_SECRET:
        abort(403, "Forbidden")


@app.post("/api/broadcast")
def broadcast():
    check_secret()
    data   = request.json
    text   = data.get("message", "")
    preview = data.get("preview", False)
    with db() as s:
        users = s.query(User).all()
        ids   = [u.telegram_id for u in users]
    if preview:
        return jsonify({"total_users": len(ids), "message_preview": text})
    sent = failed = 0
    for uid in ids:
        try:
            r = httpx.post(f"{TG_API}/sendMessage", json={
                "chat_id": uid, "text": text, "parse_mode": "HTML"
            }, timeout=5)
            if r.status_code == 200:
                sent += 1
            else:
                failed += 1
        except Exception:
            failed += 1
    return jsonify({"total": len(ids), "sent": sent, "failed": failed})


@app.get("/api/broadcast/stats")
def broadcast_stats():
    check_secret()
    with db() as s:
        total_users    = s.query(func.count(User.id)).scalar()
        total_bookings = s.query(func.count(Booking.id)).scalar()
        active         = s.query(func.count(Booking.id)).filter(
            Booking.status.in_([BookingStatus.pending, BookingStatus.confirmed])
        ).scalar()
    return jsonify({"total_users": total_users,
                    "total_bookings": total_bookings,
                    "active_bookings": active})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
