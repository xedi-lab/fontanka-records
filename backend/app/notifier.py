import os
import httpx

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


async def _send(chat_id: int, text: str):
    async with httpx.AsyncClient() as client:
        await client.post(f"{TG_API}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        })


async def notify_admins(text: str):
    for admin_id in ADMIN_IDS:
        try:
            await _send(admin_id, text)
        except Exception:
            pass


async def notify_booking_created(booking, user):
    name = f"{user.first_name} {user.last_name or ''}".strip()
    username = f" (@{user.username})" if user.username else ""
    text = (
        f"🆕 <b>Новая запись!</b>\n\n"
        f"👤 {name}{username}\n"
        f"🏠 Студия {booking.studio_id} · Гороховая 70\n"
        f"🎛️ {booking.service_title}\n"
        f"📅 {booking.booking_date} в {booking.booking_time}\n"
        f"⏱ {booking.duration_hours}ч\n\n"
        f"💰 Итого: <b>{int(booking.total_price):,} ₽</b>\n"
        f"💳 Предоплата: <b>{int(booking.prepay_amount):,} ₽</b>\n\n"
        f"🆔 ID записи: #{booking.id}"
    )
    await notify_admins(text)


async def notify_booking_cancelled(booking, user):
    name = f"{user.first_name} {user.last_name or ''}".strip()
    username = f" (@{user.username})" if user.username else ""
    text = (
        f"❌ <b>Запись отменена</b>\n\n"
        f"👤 {name}{username}\n"
        f"🏠 Студия {booking.studio_id}\n"
        f"📅 {booking.booking_date} в {booking.booking_time}\n"
        f"🆔 ID: #{booking.id}"
    )
    await notify_admins(text)


async def broadcast(user_ids: list[int], message: str):
    results = {"sent": 0, "failed": 0}
    async with httpx.AsyncClient() as client:
        for uid in user_ids:
            try:
                r = await client.post(f"{TG_API}/sendMessage", json={
                    "chat_id": uid,
                    "text": message,
                    "parse_mode": "HTML",
                })
                if r.status_code == 200:
                    results["sent"] += 1
                else:
                    results["failed"] += 1
            except Exception:
                results["failed"] += 1
    return results
