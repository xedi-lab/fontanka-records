import os
import csv
import io
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, abort, g, Response
from flask_cors import CORS
from dotenv import load_dotenv
import httpx

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_PATH      = os.getenv("DB_PATH", "/tmp/fontanka.db")
BOT_TOKEN    = os.getenv("BOT_TOKEN", "")
ADMIN_IDS    = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]
ADMIN_SECRET = os.getenv("ADMIN_SECRET", "change-me")
OWNER_PIN    = os.getenv("OWNER_PIN", "0000")
TG_API       = f"https://api.telegram.org/bot{BOT_TOKEN}"


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db:
        db.close()


def init_db():
    with sqlite3.connect(DB_PATH) as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id INTEGER UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT,
            username TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            telegram_id INTEGER UNIQUE NOT NULL,
            role TEXT DEFAULT 'Сотрудник',
            hourly_rate REAL DEFAULT 0,
            revenue_percent REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            studio_id TEXT NOT NULL,
            service_id TEXT NOT NULL,
            service_title TEXT NOT NULL,
            duration_hours INTEGER NOT NULL,
            booking_date TEXT NOT NULL,
            booking_time TEXT NOT NULL,
            total_price REAL NOT NULL,
            prepay_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """)


# ── Telegram notifications ────────────────────────────────────────────────────

def tg_send(chat_id, text):
    try:
        httpx.post(f"{TG_API}/sendMessage",
                   json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
                   timeout=5)
    except Exception:
        pass


def notify_admins(text):
    for aid in ADMIN_IDS:
        tg_send(aid, text)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/api/role/<int:telegram_id>")
def get_role(telegram_id):
    if telegram_id in ADMIN_IDS:
        return jsonify({"role": "owner"})
    db = get_db()
    emp = db.execute("SELECT id FROM employees WHERE telegram_id=?", (telegram_id,)).fetchone()
    if emp:
        return jsonify({"role": "staff"})
    return jsonify({"role": "user"})


# Users
@app.post("/api/users/upsert")
def upsert_user():
    d = request.json
    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE telegram_id=?",
                          (d["telegram_id"],)).fetchone()
    if existing:
        db.execute("UPDATE users SET first_name=?,last_name=?,username=? WHERE telegram_id=?",
                   (d["first_name"], d.get("last_name"), d.get("username"), d["telegram_id"]))
    else:
        db.execute("INSERT INTO users (telegram_id,first_name,last_name,username) VALUES (?,?,?,?)",
                   (d["telegram_id"], d["first_name"], d.get("last_name"), d.get("username")))
    db.commit()
    row = db.execute("SELECT * FROM users WHERE telegram_id=?", (d["telegram_id"],)).fetchone()
    return jsonify(dict(row))


# Bookings
@app.post("/api/bookings/<int:telegram_id>")
def create_booking(telegram_id):
    d = request.json
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    if not user:
        abort(404, "User not found")

    db.execute("""INSERT INTO bookings
        (user_id,studio_id,service_id,service_title,duration_hours,
         booking_date,booking_time,total_price,prepay_amount)
        VALUES (?,?,?,?,?,?,?,?,?)""",
        (user["id"], d["studio_id"], d["service_id"], d["service_title"],
         d["duration_hours"], d["booking_date"], d["booking_time"],
         d["total_price"], d["prepay_amount"]))
    db.commit()
    b = db.execute("SELECT * FROM bookings WHERE id=last_insert_rowid()").fetchone()

    name  = f"{user['first_name']} {user['last_name'] or ''}".strip()
    uname = f" (@{user['username']})" if user["username"] else ""
    notify_admins(
        f"🆕 <b>Новая запись!</b>\n\n"
        f"👤 {name}{uname}\n"
        f"🏠 Студия {b['studio_id']} · Гороховая 70\n"
        f"🎛️ {b['service_title']}\n"
        f"📅 {b['booking_date']} в {b['booking_time']}\n\n"
        f"💰 Итого: <b>{int(b['total_price']):,} ₽</b>\n"
        f"💳 Предоплата: <b>{int(b['prepay_amount']):,} ₽</b>\n"
        f"🆔 ID: #{b['id']}"
    )
    return jsonify(dict(b)), 201


@app.get("/api/bookings/<int:telegram_id>")
def get_bookings(telegram_id):
    db = get_db()
    user = db.execute("SELECT id FROM users WHERE telegram_id=?", (telegram_id,)).fetchone()
    if not user:
        return jsonify([])
    rows = db.execute("SELECT * FROM bookings WHERE user_id=? ORDER BY created_at DESC",
                      (user["id"],)).fetchall()
    return jsonify([dict(r) for r in rows])


@app.patch("/api/bookings/<int:booking_id>/confirm")
def confirm_booking(booking_id):
    db = get_db()
    b = db.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
    if not b:
        abort(404)
    if b["status"] != "pending":
        abort(400, "Cannot confirm")
    db.execute("UPDATE bookings SET status='confirmed' WHERE id=?", (booking_id,))
    db.commit()
    user = db.execute("SELECT * FROM users WHERE id=?", (b["user_id"],)).fetchone()
    if user:
        tg_send(user["telegram_id"],
            f"✅ <b>Ваша запись подтверждена!</b>\n\n"
            f"🏠 Студия {b['studio_id']} · {b['booking_date']} в {b['booking_time']}\n"
            f"🎛️ {b['service_title']}\n"
            f"💳 Предоплата: <b>{int(b['prepay_amount']):,} ₽</b>\n\n"
            f"Ждём вас в Фонтанка Рэкордс 🎙️"
        )
    return jsonify(dict(db.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()))


@app.patch("/api/bookings/<int:booking_id>/cancel")
def cancel_booking(booking_id):
    db = get_db()
    b = db.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()
    if not b:
        abort(404)
    if b["status"] not in ("pending", "confirmed"):
        abort(400, "Cannot cancel")
    db.execute("UPDATE bookings SET status='cancelled' WHERE id=?", (booking_id,))
    db.commit()
    user = db.execute("SELECT * FROM users WHERE id=?", (b["user_id"],)).fetchone()
    name  = f"{user['first_name']} {user['last_name'] or ''}".strip() if user else "?"
    uname = f" (@{user['username']})" if user and user["username"] else ""
    notify_admins(
        f"❌ <b>Запись отменена</b>\n\n"
        f"👤 {name}{uname}\n"
        f"🏠 Студия {b['studio_id']} · {b['booking_date']} в {b['booking_time']}\n"
        f"🆔 ID: #{booking_id}"
    )
    return jsonify(dict(db.execute("SELECT * FROM bookings WHERE id=?", (booking_id,)).fetchone()))


@app.get("/api/bookings/admin/all")
def admin_bookings():
    day = request.args.get("date")
    db = get_db()
    if day:
        rows = db.execute("SELECT * FROM bookings WHERE booking_date=? ORDER BY booking_time",
                          (day,)).fetchall()
    else:
        rows = db.execute("SELECT * FROM bookings ORDER BY booking_date,booking_time").fetchall()
    return jsonify([dict(r) for r in rows])


# Slots
ALL_SLOTS = ["10:00","11:00","12:00","13:00","14:00","15:00",
             "16:00","17:00","18:00","19:00","20:00","21:00","22:00"]


@app.get("/api/slots/<studio_id>/<day>")
def get_slots(studio_id, day):
    db = get_db()
    rows = db.execute(
        "SELECT booking_time FROM bookings WHERE studio_id=? AND booking_date=? AND status IN ('pending','confirmed')",
        (studio_id.upper(), day)
    ).fetchall()
    booked = {r["booking_time"] for r in rows}
    return jsonify({"date": day, "studio_id": studio_id,
                    "slots": [{"time": t, "available": t not in booked} for t in ALL_SLOTS]})


# Broadcast
def check_secret():
    if request.headers.get("x-admin-secret") != ADMIN_SECRET:
        abort(403, "Forbidden")


@app.post("/api/broadcast")
def broadcast():
    check_secret()
    d = request.json
    text    = d.get("message", "")
    preview = d.get("preview", False)
    db = get_db()
    ids = [r["telegram_id"] for r in db.execute("SELECT telegram_id FROM users").fetchall()]
    if preview:
        return jsonify({"total_users": len(ids), "message_preview": text})
    sent = failed = 0
    for uid in ids:
        try:
            r = httpx.post(f"{TG_API}/sendMessage",
                           json={"chat_id": uid, "text": text, "parse_mode": "HTML"},
                           timeout=5)
            sent += 1 if r.status_code == 200 else 0
            failed += 0 if r.status_code == 200 else 1
        except Exception:
            failed += 1
    return jsonify({"total": len(ids), "sent": sent, "failed": failed})


@app.get("/api/broadcast/stats")
def broadcast_stats():
    check_secret()
    db = get_db()
    total_users    = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_bookings = db.execute("SELECT COUNT(*) FROM bookings").fetchone()[0]
    active         = db.execute(
        "SELECT COUNT(*) FROM bookings WHERE status IN ('pending','confirmed')"
    ).fetchone()[0]
    return jsonify({"total_users": total_users,
                    "total_bookings": total_bookings,
                    "active_bookings": active})


# ── Owner PIN ────────────────────────────────────────────────────────────────

@app.post("/api/admin/owner/verify")
def verify_owner_pin():
    check_secret()
    if request.json.get("pin") == OWNER_PIN:
        return jsonify({"ok": True})
    abort(403, "Wrong PIN")


# ── Owner Stats ───────────────────────────────────────────────────────────────

@app.get("/api/admin/stats")
def admin_stats():
    check_secret()
    db = get_db()

    rev = db.execute("""
        SELECT
            COALESCE(SUM(CASE WHEN booking_date = date('now') THEN total_price END), 0) as today,
            COALESCE(SUM(CASE WHEN booking_date >= date('now','-7 days') THEN total_price END), 0) as week,
            COALESCE(SUM(CASE WHEN booking_date >= date('now','-30 days') THEN total_price END), 0) as month,
            COALESCE(SUM(total_price), 0) as total
        FROM bookings WHERE status != 'cancelled'
    """).fetchone()

    studios = db.execute("""
        SELECT studio_id, COUNT(*) as cnt, COALESCE(SUM(total_price),0) as revenue
        FROM bookings WHERE status != 'cancelled'
        GROUP BY studio_id
    """).fetchall()

    services = db.execute("""
        SELECT service_title, COUNT(*) as cnt, COALESCE(SUM(total_price),0) as revenue
        FROM bookings WHERE status != 'cancelled'
        GROUP BY service_title ORDER BY cnt DESC LIMIT 10
    """).fetchall()

    hours = db.execute("""
        SELECT CAST(substr(booking_time,1,2) AS INTEGER) as hour, COUNT(*) as cnt
        FROM bookings WHERE status != 'cancelled'
        GROUP BY hour ORDER BY hour
    """).fetchall()

    daily = db.execute("""
        SELECT booking_date as date,
               COALESCE(SUM(total_price),0) as revenue,
               COUNT(*) as cnt
        FROM bookings WHERE status != 'cancelled'
          AND booking_date >= date('now','-30 days')
        GROUP BY booking_date ORDER BY booking_date
    """).fetchall()

    statuses = db.execute(
        "SELECT status, COUNT(*) as cnt FROM bookings GROUP BY status"
    ).fetchall()

    total_clients = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]

    return jsonify({
        "revenue": {
            "today": rev["today"], "week": rev["week"],
            "month": rev["month"], "total": rev["total"],
        },
        "total_clients": total_clients,
        "by_studio": [{"id": r["studio_id"], "count": r["cnt"], "revenue": r["revenue"]} for r in studios],
        "by_service": [{"title": r["service_title"], "count": r["cnt"], "revenue": r["revenue"]} for r in services],
        "peak_hours": [{"hour": r["hour"], "count": r["cnt"]} for r in hours],
        "daily": [{"date": r["date"], "revenue": r["revenue"], "count": r["cnt"]} for r in daily],
        "statuses": {r["status"]: r["cnt"] for r in statuses},
    })


# ── Employees CRUD ────────────────────────────────────────────────────────────

@app.get("/api/admin/employees")
def get_employees():
    check_secret()
    db = get_db()
    rows = db.execute("SELECT * FROM employees ORDER BY created_at").fetchall()
    return jsonify([dict(r) for r in rows])


@app.post("/api/admin/employees")
def create_employee():
    check_secret()
    d = request.json
    db = get_db()
    db.execute(
        "INSERT INTO employees (name,telegram_id,role,hourly_rate,revenue_percent) VALUES (?,?,?,?,?)",
        (d["name"], d.get("telegram_id"), d.get("role", "Сотрудник"),
         d.get("hourly_rate", 0), d.get("revenue_percent", 0))
    )
    db.commit()
    row = db.execute("SELECT * FROM employees WHERE id=last_insert_rowid()").fetchone()
    return jsonify(dict(row)), 201


@app.put("/api/admin/employees/<int:emp_id>")
def update_employee(emp_id):
    check_secret()
    d = request.json
    db = get_db()
    db.execute(
        "UPDATE employees SET name=?,telegram_id=?,role=?,hourly_rate=?,revenue_percent=? WHERE id=?",
        (d["name"], d.get("telegram_id"), d.get("role", "Сотрудник"),
         d.get("hourly_rate", 0), d.get("revenue_percent", 0), emp_id)
    )
    db.commit()
    row = db.execute("SELECT * FROM employees WHERE id=?", (emp_id,)).fetchone()
    if not row:
        abort(404)
    return jsonify(dict(row))


@app.delete("/api/admin/employees/<int:emp_id>")
def delete_employee(emp_id):
    check_secret()
    db = get_db()
    db.execute("DELETE FROM employees WHERE id=?", (emp_id,))
    db.commit()
    return jsonify({"ok": True})


# ── CSV Export ────────────────────────────────────────────────────────────────

@app.get("/api/admin/export/bookings")
def export_bookings():
    check_secret()
    db = get_db()
    rows = db.execute("""
        SELECT b.id, u.first_name, u.last_name, u.username, u.telegram_id,
               b.studio_id, b.service_title, b.booking_date, b.booking_time,
               b.total_price, b.prepay_amount, b.status, b.created_at
        FROM bookings b JOIN users u ON b.user_id = u.id
        ORDER BY b.booking_date DESC
    """).fetchall()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["ID","Имя","Фамилия","Username","Telegram ID",
                "Студия","Услуга","Дата","Время","Сумма","Предоплата","Статус","Создана"])
    for r in rows:
        w.writerow(list(r))
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=bookings.csv"})


@app.get("/api/admin/export/financial")
def export_financial():
    check_secret()
    db = get_db()
    rows = db.execute("""
        SELECT booking_date, studio_id, service_title, total_price, prepay_amount, status
        FROM bookings WHERE status != 'cancelled'
        ORDER BY booking_date
    """).fetchall()
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["Дата","Студия","Услуга","Сумма","Предоплата","Статус"])
    for r in rows:
        w.writerow(list(r))
    return Response(out.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": "attachment; filename=financial.csv"})


# ── Run ───────────────────────────────────────────────────────────────────────

init_db()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
