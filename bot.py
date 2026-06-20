import json
import logging
import os
from datetime import date, datetime

from dotenv import load_dotenv
from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    Update,
)
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

import db

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
SITE_URL = "https://realfactchecknews-eng.github.io/hse-law-prep/"

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

_data_path = os.path.join(os.path.dirname(__file__), "olympiad_dates.json")
with open(_data_path, encoding="utf-8") as f:
    OLYMPIADS: list[dict] = json.load(f)

OLYMPIAD_BY_ID = {o["id"]: o for o in OLYMPIADS}

MAIN_KEYBOARD = ReplyKeyboardMarkup(
    [
        [KeyboardButton("📋 Мои подписки"), KeyboardButton("🔔 Все олимпиады")],
        [KeyboardButton("📅 Открытые сейчас"), KeyboardButton("❓ Помощь")],
    ],
    resize_keyboard=True,
)


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
                reply_markup=MAIN_KEYBOARD,
            )
            return

    await update.message.reply_text(
        "👋 Привет! Я бот для напоминаний об олимпиадах по праву.\n\n"
        "Подпишись на нужные олимпиады — пришлю оповещение за *30 дней*, *7 дней* и *1 день* до открытия регистрации.\n\n"
        f"🌐 Сайт для подготовки: {SITE_URL}\n\n"
        "Используй кнопки меню внизу 👇",
        parse_mode="Markdown",
        reply_markup=MAIN_KEYBOARD,
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
    buttons.append([
        InlineKeyboardButton("✅ Подписаться на все", callback_data="sub_all"),
        InlineKeyboardButton("❌ Отписаться от всех", callback_data="unsub_all"),
    ])

    await update.message.reply_text(
        "Нажми на олимпиаду чтобы подписаться или отписаться:\n"
        "✅ — подписан  |  🔔 — не подписан",
        reply_markup=InlineKeyboardMarkup(buttons),
    )


# ── /open ────────────────────────────────────────────────────────────────────

async def cmd_open(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    soon = []
    active = []

    for o in OLYMPIADS:
        if not o.get("regStartDate"):
            continue
        d = days_left(o["regStartDate"])
        if d is None:
            continue
        if d < 0:
            active.append((o, d))
        elif d <= 14:
            soon.append((o, d))

    lines = []
    if active:
        lines.append("*📂 Регистрация уже открыта:*")
        for o, d in active:
            lines.append(f"• [{o['name']}]({o['site']}) — идёт ({-d} дн.)")
        lines.append("")
    if soon:
        lines.append("*⏳ Открывается в ближайшие 14 дней:*")
        for o, d in soon:
            if d == 0:
                day_str = "сегодня!"
            elif d == 1:
                day_str = "завтра!"
            else:
                day_str = f"через {d} дн."
            lines.append(f"• [{o['name']}]({o['site']}) — {day_str}")
        lines.append("")

    if not lines:
        text = (
            "Сейчас нет открытых регистраций и ничего не открывается в ближайшие 2 недели.\n\n"
            "Нажми *🔔 Все олимпиады* чтобы подписаться — я напомню заранее!"
        )
    else:
        text = "\n".join(lines).strip()

    await update.message.reply_text(
        text,
        parse_mode="Markdown",
        disable_web_page_preview=True,
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


async def callback_sub_all(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    subs = set(db.get_user_subs(user_id))
    added = 0
    for o in OLYMPIADS:
        if o["id"] not in subs:
            db.subscribe(user_id, o["id"])
            added += 1
    await query.edit_message_reply_markup(reply_markup=None)
    if added:
        msg = f"✅ Подписался на все олимпиады — {len(OLYMPIADS)} шт.\nБуду напоминать за 30, 7 и 1 день до открытия регистрации."
    else:
        msg = "✅ Ты уже подписан(а) на все олимпиады."
    await query.message.reply_text(msg, parse_mode="Markdown", reply_markup=MAIN_KEYBOARD)
    await cmd_list_from_msg(query.message, user_id)


async def callback_unsub_all(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id
    subs = db.get_user_subs(user_id)
    count = len(subs)
    for oid in subs:
        db.unsubscribe(user_id, oid)
    await query.edit_message_reply_markup(reply_markup=None)
    if count:
        msg = f"❌ Отписался от всех олимпиад ({count} шт.)."
    else:
        msg = "У тебя не было активных подписок."
    await query.message.reply_text(msg, parse_mode="Markdown", reply_markup=MAIN_KEYBOARD)
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

    buttons.append([
        InlineKeyboardButton("✅ Подписаться на все", callback_data="sub_all"),
        InlineKeyboardButton("❌ Отписаться от всех", callback_data="unsub_all"),
    ])
    await message.reply_text(
        "Актуальный список:\n✅ — подписан  |  🔔 — не подписан",
        reply_markup=InlineKeyboardMarkup(buttons),
    )


# ── /my ─────────────────────────────────────────────────────────────────────

async def cmd_my(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    subs = db.get_user_subs(user_id)

    if not subs:
        await update.message.reply_text(
            "У тебя нет подписок.\n\nНажми *🔔 Все олимпиады* чтобы подписаться.",
            parse_mode="Markdown",
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

    lines.append("\nНажми *🔔 Все олимпиады* чтобы изменить подписки.")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


# ── /help ────────────────────────────────────────────────────────────────────

async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "*Право Олимп — бот напоминаний*\n\n"
        "🔔 *Все олимпиады* — подписаться или отписаться\n"
        "📋 *Мои подписки* — твои активные подписки и даты\n"
        "📅 *Открытые сейчас* — регистрации открытые или открывающиеся в ближайшие 2 недели\n\n"
        "Уведомления приходят за *30 дней*, *7 дней* и *1 день* до ожидаемого "
        "открытия регистрации. Даты ориентировочные — проверяй на официальном сайте.\n\n"
        f"🌐 {SITE_URL}",
        parse_mode="Markdown",
        disable_web_page_preview=True,
    )


# ── Keyboard button text handler ──────────────────────────────────────────────

async def handle_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if text == "📋 Мои подписки":
        await cmd_my(update, ctx)
    elif text == "🔔 Все олимпиады":
        await cmd_list(update, ctx)
    elif text == "📅 Открытые сейчас":
        await cmd_open(update, ctx)
    elif text == "❓ Помощь":
        await cmd_help(update, ctx)


# ── Daily notification job ────────────────────────────────────────────────────

async def send_notifications(ctx: ContextTypes.DEFAULT_TYPE):
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
            if db.was_sent(uid, o["id"], d):
                continue
            try:
                await ctx.bot.send_message(
                    uid, text, parse_mode="Markdown", disable_web_page_preview=True
                )
                db.mark_sent(uid, o["id"], d)
            except Exception as e:
                logger.warning("Failed to notify user %s: %s", uid, e)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    db.init_db()

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("list", cmd_list))
    app.add_handler(CommandHandler("my", cmd_my))
    app.add_handler(CommandHandler("open", cmd_open))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CallbackQueryHandler(callback_toggle, pattern=r"^toggle_"))
    app.add_handler(CallbackQueryHandler(callback_sub_all, pattern=r"^sub_all$"))
    app.add_handler(CallbackQueryHandler(callback_unsub_all, pattern=r"^unsub_all$"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    # Daily notifications at 10:00 Moscow time (UTC+3 = 07:00 UTC)
    app.job_queue.run_daily(send_notifications, time=datetime.strptime("07:00", "%H:%M").time())

    logger.info("Bot started")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
