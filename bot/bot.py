import json
import logging
import os
from datetime import date, datetime

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

import db

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
SITE_URL = "https://realfactchecknews-eng.github.io/hse-law-prep/"

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load olympiad data
_data_path = os.path.join(os.path.dirname(__file__), "olympiad_dates.json")
with open(_data_path, encoding="utf-8") as f:
    OLYMPIADS: list[dict] = json.load(f)

OLYMPIAD_BY_ID = {o["id"]: o for o in OLYMPIADS}


def days_left(date_str: str | None) -> int | None:
    if not date_str:
        return None
    today = date.today()
    target = date.fromisoformat(date_str)
    return (target - today).days


def format_days(d: int) -> str:
    if d < 0:
        return "сезон идёт"
    if d == 0:
        return "сегодня открытие!"
    if d == 1:
        return "завтра!"
    return f"через {d} дн."


# ── /start ──────────────────────────────────────────────────────────────────

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    args = ctx.args
    user_id = update.effective_user.id

    # Deep link: /start sub_<olympiad_id>
    if args and args[0].startswith("sub_"):
        oid = args[0][4:]
        o = OLYMPIAD_BY_ID.get(oid)
        if o:
            added = db.subscribe(user_id, oid)
            status = "Подписка оформлена ✅" if added else "Ты уже подписан(а) ✅"
            await update.message.reply_text(
                f"{status}\n\n"
                f"*{o['name']}* ({o['level']})\n"
                f"Напомню за 30 дней, за 7 дней и за 1 день до открытия регистрации.\n\n"
                f"🔗 {o['site']}",
                parse_mode="Markdown",
            )
            return

    await update.message.reply_text(
        "👋 Привет! Я бот для напоминаний об олимпиадах по праву.\n\n"
        "Подпишись на нужные олимпиады — пришлю оповещение за *30 дней*, *7 дней* и *1 день* до открытия регистрации.\n\n"
        f"🌐 Сайт для подготовки: {SITE_URL}\n\n"
        "Команды:\n"
        "/list — список олимпиад и подписки\n"
        "/my — мои подписки\n"
        "/help — справка",
        parse_mode="Markdown",
    )


# ── /list ───────────────────────────────────────────────────────────────────

async def cmd_list(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    subs = set(db.get_user_subs(user_id))

    buttons = []
    for o in OLYMPIADS:
        d = days_left(o["regStartDate"])
        is_sub = o["id"] in subs
        prefix = "✅ " if is_sub else "🔔 "
        suffix = f"  ({format_days(d)})" if d is not None else ""
        label = f"{prefix}{o['name']}{suffix}"
        buttons.append([InlineKeyboardButton(label, callback_data=f"toggle_{o['id']}")])

    await update.message.reply_text(
        "Выбери олимпиады для подписки/отписки:\n"
        "✅ — подписан | 🔔 — не подписан",
        reply_markup=InlineKeyboardMarkup(buttons),
    )


# ── Inline button callback ───────────────────────────────────────────────────

async def callback_toggle(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    oid = query.data[len("toggle_"):]
    o = OLYMPIAD_BY_ID.get(oid)
    if not o:
        return

    subs = set(db.get_user_subs(user_id))
    if oid in subs:
        db.unsubscribe(user_id, oid)
        msg = f"❌ Отписался от *{o['name']}*"
    else:
        db.subscribe(user_id, oid)
        msg = f"✅ Подписался на *{o['name']}*"

    await query.edit_message_reply_markup(reply_markup=None)
    await query.message.reply_text(msg, parse_mode="Markdown")
    await cmd_list_from_msg(query.message, user_id)


async def cmd_list_from_msg(message, user_id: int):
    subs = set(db.get_user_subs(user_id))
    buttons = []
    for o in OLYMPIADS:
        d = days_left(o["regStartDate"])
        is_sub = o["id"] in subs
        prefix = "✅ " if is_sub else "🔔 "
        suffix = f"  ({format_days(d)})" if d is not None else ""
        label = f"{prefix}{o['name']}{suffix}"
        buttons.append([InlineKeyboardButton(label, callback_data=f"toggle_{o['id']}")])

    await message.reply_text(
        "Актуальный список:\n✅ — подписан | 🔔 — не подписан",
        reply_markup=InlineKeyboardMarkup(buttons),
    )


# ── /my ─────────────────────────────────────────────────────────────────────

async def cmd_my(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    subs = db.get_user_subs(user_id)

    if not subs:
        await update.message.reply_text(
            "У тебя нет подписок.\n\n/list — подписаться на олимпиады"
        )
        return

    lines = ["*Твои подписки:*\n"]
    for oid in subs:
        o = OLYMPIAD_BY_ID.get(oid)
        if not o:
            continue
        d = days_left(o["regStartDate"])
        d_str = f"  ({format_days(d)})" if d is not None else "  (дата не определена)"
        lines.append(f"• {o['name']}{d_str}")

    await update.message.reply_text(
        "\n".join(lines) + "\n\n/list — изменить подписки",
        parse_mode="Markdown",
    )


# ── /help ────────────────────────────────────────────────────────────────────

async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*Право Олимп — бот напоминаний*\n\n"
        "/list — список олимпиад (подписаться / отписаться)\n"
        "/my — мои подписки с датами\n"
        "/help — эта справка\n\n"
        f"🌐 Сайт для подготовки: {SITE_URL}\n\n"
        "Уведомления приходят за 30 дней, 7 дней и 1 день до ожидаемого открытия регистрации. "
        "Даты ориентировочные — проверяй на официальном сайте олимпиады.",
        parse_mode="Markdown",
    )


# ── Daily notification job ────────────────────────────────────────────────────

async def send_notifications(ctx: ContextTypes.DEFAULT_TYPE):
    today = date.today()
    notify_days = {30, 7, 1}

    for o in OLYMPIADS:
        if not o.get("regStartDate"):
            continue
        d = days_left(o["regStartDate"])
        if d not in notify_days:
            continue

        subscribers = db.get_subscribers(o["id"])
        if not subscribers:
            continue

        if d == 1:
            timing = "завтра открывается регистрация"
        elif d == 7:
            timing = "регистрация открывается через 7 дней"
        else:
            timing = "регистрация открывается через 30 дней"

        reg_date = date.fromisoformat(o["regStartDate"])
        reg_date_str = reg_date.strftime("%-d %B %Y")

        text = (
            f"🔔 *{o['name']}* — {timing}!\n\n"
            f"📅 Ожидаемое открытие: {reg_date_str}\n"
            f"⚠️ {o['regStartNote']}\n\n"
            f"🔗 [Перейти на сайт олимпиады]({o['site']})"
        )

        for uid in subscribers:
            try:
                await ctx.bot.send_message(uid, text, parse_mode="Markdown", disable_web_page_preview=True)
            except Exception as e:
                logger.warning("Failed to notify user %s: %s", uid, e)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    db.init_db()

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("list", cmd_list))
    app.add_handler(CommandHandler("my", cmd_my))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CallbackQueryHandler(callback_toggle, pattern=r"^toggle_"))

    # Daily notifications at 10:00 Moscow time (UTC+3 = 07:00 UTC)
    app.job_queue.run_daily(send_notifications, time=datetime.strptime("07:00", "%H:%M").time())

    logger.info("Bot started")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
