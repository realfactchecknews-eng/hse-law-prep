#!/usr/bin/env python3
"""
Проверяет сайты олимпиад из data.js и создаёт issue в GitHub,
если сайт недоступен или его страница изменилась.
Сохраняет снепшоты хешей в .olympiad-snapshots.json
Запускается через GitHub Actions раз в неделю.
"""

import json
import os
import sys
import hashlib
import re
import requests
from datetime import datetime

DATA_PATH = 'js/data.js'
SNAPSHOTS_PATH = '.olympiad-snapshots.json'
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO = os.environ.get('GITHUB_REPOSITORY', 'realfactchecknews-eng/hse-law-prep')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}


def load_data():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        text = f.read()
    start = text.index('{')
    end = text.rfind('};')
    return json.loads(text[start:end + 1])


def load_snapshots():
    if os.path.exists(SNAPSHOTS_PATH):
        with open(SNAPSHOTS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}


def save_snapshots(snapshots):
    with open(SNAPSHOTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(snapshots, f, ensure_ascii=False, indent=2)


def normalize(text):
    """Убираем очень изменчивые части страницы (пробелы, скрипты, стили)."""
    # Убираем скрипты и стили
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Убираем лишние пробелы
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def fetch(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20, allow_redirects=True)
        return resp.status_code, resp.text, resp.url
    except Exception as e:
        return None, str(e), url


def hash_text(text):
    return hashlib.md5(normalize(text).encode('utf-8')).hexdigest()


def github_api(method, path, json_data=None):
    url = f'https://api.github.com/repos/{REPO}{path}'
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github+json'
    }
    if method == 'GET':
        return requests.get(url, headers=headers)
    if method == 'POST':
        return requests.post(url, headers=headers, json=json_data)
    return None


def existing_issue_title(title):
    resp = github_api('GET', '/issues?state=open&labels=olympiad-check')
    if resp and resp.status_code == 200:
        for issue in resp.json():
            if issue['title'] == title:
                return True
    return False


def create_issue(title, body):
    if not GITHUB_TOKEN:
        print(f'[SKIP] No GITHUB_TOKEN. Would create issue:\n{title}\n{body}')
        return False
    if existing_issue_title(title):
        print(f'[SKIP] Issue already exists: {title}')
        return False
    resp = github_api('POST', '/issues', {
        'title': title,
        'body': body,
        'labels': ['olympiad-check']
    })
    if resp and resp.status_code == 201:
        print(f'[CREATE] {title}')
        return True
    else:
        print(f'[ERROR] Failed to create issue: {resp.status_code if resp else None}')
        return False


def main():
    data = load_data()
    snapshots = load_snapshots()
    reports = []
    new_snapshots = {}

    for o in data['olympiads']:
        if not o.get('links'):
            continue
        url = o['links'][0]['url']
        status, text, final_url = fetch(url)
        print(f"Checking {o['name']} -> {url} (status={status})")

        if status is None or status >= 400:
            reports.append({
                'olympiad': o['name'],
                'url': url,
                'problem': f'сайт недоступен (HTTP {status})',
                'details': text[:200]
            })
            continue

        h = hash_text(text)
        new_snapshots[o['id']] = {
            'url': url,
            'hash': h,
            'checked_at': datetime.now().isoformat(),
            'status': status
        }

        old = snapshots.get(o['id'])
        if old and old.get('hash') != h:
            reports.append({
                'olympiad': o['name'],
                'url': url,
                'problem': 'страница изменилась с прошлой проверки',
                'details': f'Старый хеш: {old["hash"]}\nНовый хеш: {h}\nВозможно, появились новые даты или регламент.'
            })

    save_snapshots(new_snapshots)

    if not reports:
        print('No changes detected.')
        return

    body_lines = [f'Автоматическая проверка олимпиад от {datetime.now().strftime("%d.%m.%Y %H:%M")}.\n']
    for r in reports:
        body_lines.append(f"## {r['olympiad']}")
        body_lines.append(f"- **Сайт:** {r['url']}")
        body_lines.append(f"- **Проблема:** {r['problem']}")
        body_lines.append(f"- **Детали:** {r['details']}")
        body_lines.append('')
    body_lines.append('---')
    body_lines.append('Проверьте, нужно ли обновить `js/data.js` и `js/app.js`.')

    title = f'[Олимпиады] Требуется проверка: {len(reports)} изменений'
    create_issue(title, '\n'.join(body_lines))


if __name__ == '__main__':
    main()
