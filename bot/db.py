import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "subscribers.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                user_id   INTEGER,
                olympiad_id TEXT,
                PRIMARY KEY (user_id, olympiad_id)
            )
        """)
        conn.commit()


def subscribe(user_id: int, olympiad_id: str) -> bool:
    """Returns True if newly subscribed, False if already was."""
    try:
        with get_conn() as conn:
            conn.execute(
                "INSERT INTO subscriptions (user_id, olympiad_id) VALUES (?, ?)",
                (user_id, olympiad_id),
            )
            conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def unsubscribe(user_id: int, olympiad_id: str) -> bool:
    """Returns True if removed, False if wasn't subscribed."""
    with get_conn() as conn:
        cur = conn.execute(
            "DELETE FROM subscriptions WHERE user_id=? AND olympiad_id=?",
            (user_id, olympiad_id),
        )
        conn.commit()
    return cur.rowcount > 0


def unsubscribe_all(user_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM subscriptions WHERE user_id=?", (user_id,))
        conn.commit()


def get_user_subs(user_id: int) -> list[str]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT olympiad_id FROM subscriptions WHERE user_id=?", (user_id,)
        ).fetchall()
    return [r["olympiad_id"] for r in rows]


def get_subscribers(olympiad_id: str) -> list[int]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT user_id FROM subscriptions WHERE olympiad_id=?", (olympiad_id,)
        ).fetchall()
    return [r["user_id"] for r in rows]
