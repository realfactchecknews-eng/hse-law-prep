# Настройка AI-юриста на сайте (Cloudflare Pages)

AI-юрист работает через **Cloudflare Pages Function** — файл `functions/api/chat.js` в репозитории автоматически обслуживает маршрут `/api/chat` на том же домене. Ключ OpenRouter хранится в env-переменной Cloudflare (не в коде).

## Почему нельзя хранить ключ в JS

Файлы, которые браузер загружает со статического сайта (`js/data.js`, `js/config.js`, `js/app.js`), видны всем через DevTools. Поэтому запрос к OpenRouter делается через серверную функцию, а ключ хранится в секретах Cloudflare — браузер его никогда не видит.

## Шаг 1: Зарегистрироваться на OpenRouter

1. Откройте <https://openrouter.ai/>.
2. Зарегистрируйтесь и пополните баланс (минимум несколько долларов).
3. Создайте API-ключ: <https://openrouter.ai/settings/keys>.
4. Скопируйте ключ — он понадобится на шаге 2.

## Шаг 2: Добавить переменные в Cloudflare Pages

1. Откройте проект в Cloudflare Dashboard → **Settings** → **Environment variables**.
2. Нажмите **Add variable** и добавьте:

   | Variable name         | Value                        | Encrypt |
   |-----------------------|------------------------------|---------|
   | `OPENROUTER_API_KEY`  | ваш ключ из OpenRouter       | ✅ да   |
   | `ALLOWED_ORIGINS`     | `https://pravolymp.ru`       | нет     |

3. Нажмите **Save and deploy** — Cloudflare пересоберёт сайт с новыми переменными.

> Если тестируете локально, добавьте в `ALLOWED_ORIGINS` через запятую: `https://pravolymp.ru,http://localhost:8000`

## Шаг 3: Привязать домен pravolymp.ru

1. В проекте Pages → **Custom domains** → **Set up a custom domain** → введите `pravolymp.ru`.
2. Cloudflare покажет CNAME-запись, например:
   ```
   Тип:  CNAME
   Имя:  pravolymp.ru  (или @)
   Цель: <ваш-проект>.pages.dev
   ```
3. Зайдите в личный кабинет вашего регистратора домена (.ru) → раздел **DNS** → добавьте эту CNAME-запись.
   - **Переносить домен к Cloudflare не нужно** — .ru домены Cloudflare Registrar не принимает, но это неважно.
4. Дождитесь выпуска SSL (обычно 5–15 минут после распространения DNS).

## Шаг 4: Проверить работу

1. Откройте `https://pravolymp.ru`.
2. Нажмите кнопку **AI-юрист** в правом нижнем углу.
3. Задайте вопрос, например: «Что такое правовая норма?»
4. Через несколько секунд придёт ответ.
5. В DevTools → Network убедитесь, что запрос уходит на `pravolymp.ru/api/chat` и возвращает 200.

## Ограничения и безопасность

- История чата хранится только в браузере пользователя (`localStorage`).
- Ключ OpenRouter не виден посетителям сайта.
- Для дополнительной защиты можно включить Rate Limiting в Cloudflare (Settings проекта).
- Используется модель `openai/gpt-4o-mini` — дешёвая и качественная. При желании можно заменить в `functions/api/chat.js`.

## Модель и стоимость

- Модель по умолчанию: `openai/gpt-4o-mini`.
- 1000 вопросов обходятся примерно в $0.30–$0.60.
- Альтернативы (дешевле): `meta-llama/llama-3.1-8b-instruct`, `google/gemini-flash-1.5`.

## Что делать, если не работает

- Откройте DevTools → Console на сайте и посмотрите ошибки.
- В Cloudflare Dashboard → проект Pages → **Functions** → **Real-time logs** проверьте запросы.
- Убедитесь, что `ALLOWED_ORIGINS` содержит точный URL сайта (с `https://`).
- Убедитесь, что `OPENROUTER_API_KEY` добавлен с включённым **Encrypt**.
- После изменения переменных нажмите **Save and deploy** — функции обновляются только при новом деплое.
