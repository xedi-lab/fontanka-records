import os
import httpx
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

router = Router()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me")


def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS


class BroadcastState(StatesGroup):
    waiting_message = State()
    confirm = State()


@router.message(Command("admin"))
async def admin_panel(message: Message):
    if not is_admin(message.from_user.id):
        return

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{BACKEND_URL}/api/broadcast/stats",
            headers={"x-admin-secret": ADMIN_SECRET},
        )
    stats = r.json() if r.status_code == 200 else {}

    text = (
        f"🛠 <b>Админ-панель Фонтанка Рэкордс</b>\n\n"
        f"👥 Пользователей: <b>{stats.get('total_users', '—')}</b>\n"
        f"📋 Всего записей: <b>{stats.get('total_bookings', '—')}</b>\n"
        f"🔥 Активных записей: <b>{stats.get('active_bookings', '—')}</b>\n\n"
        f"<b>Команды:</b>\n"
        f"/broadcast — отправить рассылку всем клиентам\n"
        f"/bookings — все записи на сегодня\n"
        f"/admin — эта панель"
    )
    await message.answer(text, parse_mode="HTML")


@router.message(Command("broadcast"))
async def start_broadcast(message: Message, state: FSMContext):
    if not is_admin(message.from_user.id):
        return

    # Preview users count
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{BACKEND_URL}/api/broadcast",
            json={"message": "preview", "preview": True},
            headers={"x-admin-secret": ADMIN_SECRET},
        )
    count = r.json().get("total_users", "?") if r.status_code == 200 else "?"

    await message.answer(
        f"📢 <b>Рассылка</b>\n\n"
        f"Сообщение получат <b>{count}</b> клиентов.\n\n"
        f"Напиши текст сообщения (можно использовать <b>жирный</b>, <i>курсив</i>):\n\n"
        f"Или /cancel для отмены.",
        parse_mode="HTML",
    )
    await state.set_state(BroadcastState.waiting_message)


@router.message(BroadcastState.waiting_message, F.text)
async def receive_broadcast_text(message: Message, state: FSMContext):
    if message.text == "/cancel":
        await state.clear()
        await message.answer("Отменено.")
        return

    await state.update_data(broadcast_text=message.text)

    preview = message.text[:200] + ("..." if len(message.text) > 200 else "")
    await message.answer(
        f"📋 <b>Предпросмотр:</b>\n\n{preview}\n\n"
        f"Отправить рассылку? Напиши <b>да</b> для подтверждения или /cancel для отмены.",
        parse_mode="HTML",
    )
    await state.set_state(BroadcastState.confirm)


@router.message(BroadcastState.confirm, F.text)
async def confirm_broadcast(message: Message, state: FSMContext):
    if message.text.lower() not in ("да", "yes", "отправить"):
        await state.clear()
        await message.answer("Отменено. /broadcast чтобы начать заново.")
        return

    data = await state.get_data()
    text = data.get("broadcast_text", "")
    await state.clear()

    wait_msg = await message.answer("⏳ Отправляем...")

    async with httpx.AsyncClient(timeout=120) as client:
        r = await client.post(
            f"{BACKEND_URL}/api/broadcast",
            json={"message": text, "preview": False},
            headers={"x-admin-secret": ADMIN_SECRET},
        )

    if r.status_code == 200:
        res = r.json()
        await wait_msg.edit_text(
            f"✅ <b>Рассылка завершена!</b>\n\n"
            f"📤 Отправлено: <b>{res.get('sent', 0)}</b>\n"
            f"❌ Ошибок: <b>{res.get('failed', 0)}</b>",
            parse_mode="HTML",
        )
    else:
        await wait_msg.edit_text("❌ Ошибка при рассылке. Попробуй снова.")


@router.message(Command("bookings"))
async def today_bookings(message: Message):
    if not is_admin(message.from_user.id):
        return

    from datetime import date
    today = date.today().isoformat()

    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BACKEND_URL}/api/bookings/admin/all?date={today}")

    if r.status_code != 200:
        await message.answer("Ошибка загрузки записей.")
        return

    bookings = r.json()
    if not bookings:
        await message.answer(f"📅 На <b>{today}</b> записей нет.", parse_mode="HTML")
        return

    lines = [f"📅 <b>Записи на {today}:</b>\n"]
    for b in bookings:
        status_icon = {"pending": "⏳", "confirmed": "✅", "completed": "🏁", "cancelled": "❌"}.get(b["status"], "•")
        lines.append(
            f"{status_icon} <b>{b['booking_time']}</b> · Студия {b['studio_id']}\n"
            f"   {b['service_title']} · {int(b['total_price']):,} ₽\n"
            f"   ID #{b['id']}\n"
        )

    await message.answer("\n".join(lines), parse_mode="HTML")
