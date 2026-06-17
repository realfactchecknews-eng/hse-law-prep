# Контекст проекта для AI-ассистента

## Что это за проект
Статический сайт-платформа для подготовки к олимпиадам по праву (Высшая проба, ВСОШ, РСОШ) и поступления на юриспруденцию в ВШЭ и другие вузы. Контент берётся из PDF-презентаций онлайн-школы «Общее дело» и учебников по ТГП. Сайт развёртывается на GitHub Pages.

## Репозиторий и деплой
- GitHub: `https://github.com/realfactchecknews-eng/hse-law-prep.git`
- GitHub Pages (основной сайт): `https://realfactchecknews-eng.github.io/hse-law-prep/`
- AI-прокси (Netlify): `https://pravo-olymp.netlify.app` — функция `netlify/functions/chat.js`
- Кастомный домен AI-прокси: `https://pravolymp.ru` — куплен на reg.ru, подключён к Netlify
- `js/config.js` содержит: `AI_PROXY_URL: 'https://pravolymp.ru'`

## ✅ Текущий статус AI-юриста
- Netlify функция задеплоена и работает корректно
- Домен `pravolymp.ru` добавлен в Netlify, nameservers на reg.ru переключены на Netlify DNS (`dns1-4.p06.nsone.net`)
- DNS пропагируется — может занять до 48 часов после смены nameservers
- Переменная `ALLOWED_ORIGINS` в Netlify **удалена** (чтобы не блокировать запросы по CORS)
- Переменная `OPENROUTER_API_KEY` в Netlify установлена
- Пока DNS не пропагировался — сайт и AI работают только с VPN

## ⚠️ Что нужно проверить когда DNS пропагируется
1. Открыть `https://realfactchecknews-eng.github.io/hse-law-prep/` без VPN
2. Написать вопрос AI-юристу — должен ответить без ошибок
3. Если ошибка "Origin not allowed" — значит `ALLOWED_ORIGINS` случайно снова добавили в Netlify, нужно удалить
4. Если "Load failed" — значит `pravolymp.ru` ещё не пропагировался, ждать дальше

## История проблем с AI-юристом и что делали

### Проблема 1: кончился баланс OpenRouter
Пользователь обновил API-ключ в Cloudflare Dashboard → Settings → Variables → `OPENROUTER_API_KEY`.

### Проблема 2: Cloudflare Workers (.workers.dev) заблокирован в России
`.workers.dev` домены блокируются у многих российских провайдеров без VPN.
**Решение:** переехали на Netlify Functions.

### Проблема 3: Netlify (.netlify.app) тоже заблокирован
**Решение:** купили домен `pravolymp.ru` на reg.ru (~170 руб/год), подключили к Netlify.

### Проблема 4: баг с кириллицей в HTTP-заголовке
В `netlify/functions/chat.js` был заголовок `'X-Title': 'Право olymp AI'` — Node.js не принимает кириллицу в HTTP-заголовках.
**Решение:** заменили на `'X-Title': 'Pravo Olymp AI'`.

### Проблема 5: CORS "Origin not allowed"
В Netlify была установлена переменная `ALLOWED_ORIGINS` с неправильным значением.
**Решение:** переменную удалили из Netlify. Без неё функция разрешает все источники.

## Структура AI-прокси (актуальная)
- `netlify/functions/chat.js` — серверная Netlify функция (основной прокси)
- `netlify.toml` — редирект `/api/chat` → `/.netlify/functions/chat`
- `workers/ai-proxy.js` — старый Cloudflare Worker (не используется, оставлен в репо)
- `api/chat.js`, `vercel.json` — Vercel-версия (не используется, пробовали Vercel но у пользователя нет US номера)
- Переменные в Netlify: только `OPENROUTER_API_KEY` (ALLOWED_ORIGINS удалена)
- Модель: `openai/gpt-4o-mini` через OpenRouter

## Настройка DNS (сделано)
- Домен: `pravolymp.ru` на reg.ru
- Nameservers на reg.ru изменены на: `dns1.p06.nsone.net`, `dns2.p06.nsone.net`, `dns3.p06.nsone.net`, `dns4.p06.nsone.net`
- В Netlify: Domain management → pravolymp.ru (Primary domain), www.pravolymp.ru (редирект)
- A-записи (`@ → 75.2.60.5`, `www → 75.2.60.5`) добавлены на reg.ru но они теперь не активны т.к. nameservers переключены на Netlify

## Структура проекта
```
hse-law-prep/
├── index.html                # Главная страница, SPA-оболочка
├── css/style.css             # Стили, включая стили чата
├── js/
│   ├── app.js                # Роутинг, рендер, тесты, прогресс, AI-чат
│   ├── data.js               # Все данные: олимпиады, вузы, темы, тесты
│   └── config.js             # AI_PROXY_URL = 'https://pravolymp.ru'
├── netlify/functions/
│   └── chat.js               # Netlify Function — прокси к OpenRouter
├── netlify.toml              # Редирект /api/chat → /.netlify/functions/chat
├── workers/
│   └── ai-proxy.js           # Старый Cloudflare Worker (не используется)
├── api/
│   └── chat.js               # Vercel Function (не используется)
├── vercel.json               # Конфиг Vercel (не используется)
├── .github/workflows/
│   └── check_olympiads.yml   # GitHub Actions для проверки сайтов олимпиад
├── scripts/
│   └── check_olympiads.py    # Скрипт проверки хешей сайтов олимпиад
├── assets/
│   ├── logo.svg
│   └── favicon.svg/.png/.ico
├── README.md
├── PROJECT.md
├── AI_CHAT_SETUP.md          # Инструкция по настройке AI-юриста (устарела)
└── AI_CONTEXT.md             # Этот файл
```

## Технологии
- Чистый HTML/CSS/JS, без сборки, без фреймворков.
- Данные хранятся в `js/data.js` как JavaScript-объект `APP_DATA`.
- SPA-роутинг через хеш (`#topics`, `#tests`, `#topic/id`, `#test/id`, `#olympiads`, `#universities`, `#progress`).
- `localStorage`: `law-prep-progress` — прогресс, `law-prep-ai-chat` — история чата.
- AI-ассистент: OpenRouter API (`openai/gpt-4o-mini`), прокси через Netlify Functions.

## Ключевые данные в `js/data.js`
- `olympiads`: 15 олимпиад с уровнями РСОШ, льготами, сроками, ссылками
- `universities`: 17 вузов с программами, экзаменами, проходными баллами
- `topics`: 22 темы (16 по ТГП + 6 по конституционному праву)
- `tests`: 22 теста (ТГП по 12–13 вопросов, конституционные по 3 вопроса)

## Форматы данных
### Тема
```js
{
  "id": "уникальный-id",
  "category": "Категория",
  "title": "Название темы",
  "source": "Общее дело — предмет",
  "summary": "Краткое описание",
  "content": "<h3>...</h3><p>...</p>",
  "tags": ["тег1", "тег2"]
}
```

### Тест
```js
{
  "id": "test-идентификатор",
  "title": "Тест: название",
  "topicId": "id-темы",
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "text": "Вопрос",
      "options": [
        {"id": "a1", "text": "Ответ 1", "correct": false},
        {"id": "a2", "text": "Ответ 2", "correct": true}
      ],
      "explanation": "Пояснение"
    }
  ]
}
```

## Рабочий процесс (как вносить изменения)
1. AI редактирует файлы и пушит в ветку `claude/...`
2. Пользователь на GitHub создаёт PR и мержит в `main`
3. GitHub Pages автоматически обновляется (~1 минута)
4. Netlify тоже автоматически передеплоится при пуше в `main`

## Как проверить AI-прокси
```bash
curl -X POST https://pravolymp.ru/api/chat \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://realfactchecknews-eng.github.io' \
  -d '{"messages":[{"role":"user","content":"Что такое ТГП?"}]}'
```

## Следующие возможные шаги
- Добавить новые блоки: административное, уголовное, гражданское, процессуальное право
- Добавить больше тестовых вопросов, особенно к конституционным тестам
- Обновить проходные баллы вузов по данным 2026 года
- Улучшить дизайн, добавить тёмную тему
- Добавить AI-режим «объясни тему простыми словами» или «сгенерируй тест»

## О проекте
- Проект делает ученик лицея НИУ ВШЭ для подготовки к олимпиадам по праву
- Целевая аудитория: школьники 7–11 классов в России
- Источники: PDF-презентации «Общее дело», учебники Морозовой и Матузова-Малько по ТГП, официальные сайты олимпиад и вузов
