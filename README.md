# Фонтанка Рэкордс — Telegram Mini App

## Структура проекта

```
fontanka-records/
├── frontend/    # React + Vite + Tailwind (Telegram Mini App)
├── backend/     # FastAPI + SQLite
└── bot/         # aiogram 3 (Telegram Bot)
```

## Запуск

### 1. Frontend (Mini App)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5174
npm run build        # production build → dist/
```

### 2. Backend (API)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 3. Bot
```bash
cd bot
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## Конфигурация

### bot/.env
```
BOT_TOKEN=ваш_токен
MINI_APP_URL=https://your-domain.com   # URL задеплоенного фронтенда
BACKEND_URL=http://localhost:8000
```

### backend/.env
```
BOT_TOKEN=ваш_токен
DATABASE_URL=sqlite+aiosqlite:///./fontanka.db
SECRET_KEY=замените-в-продакшене
```

## Деплой

1. **Frontend** → Vercel / Netlify (бесплатно, просто)
2. **Backend** → Railway / VPS (нужен постоянный адрес)
3. **Bot** → тот же VPS что и бэкенд

После деплоя:
- Обновить `MINI_APP_URL` в `bot/.env`
- Зарегистрировать Mini App в @BotFather → `/newapp`
- Поменять токен бота!

## Залы

| Студия | Стиль | Цвет |
|--------|-------|------|
| A | Лофт-мансарда, мульти-неон, большое пространство | Фиолетовый |
| B | Профессиональный зал, красно-синий, акустика | Розовый |
| C | Бетонный минимализм, синий неон, компактно | Голубой |
