from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
import os

router = Router()

MINI_APP_URL = os.getenv("MINI_APP_URL", "https://your-domain.com")


@router.message(CommandStart())
async def start(message: Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🎤 Открыть Фонтанка Рэкордс",
            web_app=WebAppInfo(url=MINI_APP_URL),
        )
    ]])

    await message.answer(
        f"Привет, <b>{message.from_user.first_name}</b>! 🦋\n\n"
        "Добро пожаловать в <b>Фонтанка Рэкордс</b> — студию звукозаписи на Гороховой 70.\n\n"
        "Три зала, профессиональное оборудование, звукорежиссёры и вокальные педагоги — всё в одном месте.\n\n"
        "Нажми кнопку ниже, чтобы выбрать услугу и записаться 👇",
        parse_mode="HTML",
        reply_markup=kb,
    )
