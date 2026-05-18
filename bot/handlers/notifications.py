from aiogram import Bot
import httpx
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


async def send_booking_confirmation(bot: Bot, telegram_id: int, booking: dict):
    studio = booking.get("studio_id", "")
    service = booking.get("service_title", "")
    date = booking.get("booking_date", "")
    time = booking.get("booking_time", "")
    total = booking.get("total_price", 0)
    prepay = booking.get("prepay_amount", 0)

    text = (
        f"✅ <b>Запись подтверждена!</b>\n\n"
        f"🏠 Студия {studio} · Гороховая 70\n"
        f"🎛️ {service}\n"
        f"📅 {date} в {time}\n\n"
        f"💰 Итого: <b>{int(total):,} ₽</b>\n"
        f"💳 Предоплата: <b>{int(prepay):,} ₽</b>\n\n"
        f"Администратор свяжется с тобой для оплаты предоплаты. "
        f"Напомним за день до сессии! 🦋"
    )
    await bot.send_message(telegram_id, text, parse_mode="HTML")


async def send_reminder(bot: Bot, telegram_id: int, booking: dict):
    studio = booking.get("studio_id", "")
    time = booking.get("booking_time", "")
    text = (
        f"⏰ <b>Напоминание!</b>\n\n"
        f"Завтра у тебя запись в студии {studio} в <b>{time}</b>.\n"
        f"Гороховая 70, Санкт-Петербург.\n\n"
        f"Ждём тебя! 🎤"
    )
    await bot.send_message(telegram_id, text, parse_mode="HTML")
