# Настройка AI-юриста на сайте

Сайт уже содержит frontend-попап чата. Для работы нужно развернуть бесплатный прокси на Cloudflare Workers и добавить туда API-ключ OpenRouter.

## Почему нельзя хранить ключ в JS

GitHub Pages отдаёт сайт как статические файлы. Любой API-ключ, записанный в `js/data.js` или `js/config.js`, будет виден всем посетителям в DevTools. Поэтому запросы к OpenRouter идут через прокси, а ключ хранится в секретах Cloudflare.

## Шаг 1: Зарегистрироваться на OpenRouter

1. Откройте <https://openrouter.ai/>.
2. Зарегистрируйтесь и пополните баланс (минимум несколько долларов).
3. Создайте API-ключ: <https://openrouter.ai/settings/keys>.
4. Скопируйте ключ — он понадобится на шаге 3.

## Шаг 2: Развернуть Cloudflare Worker

1. Зарегистрируйтесь на <https://workers.cloudflare.com/> (бесплатный план даёт 100 000 запросов в день).
2. В Dashboard перейдите в **Workers & Pages** → **Create application** → **Create Worker**.
3. Дайте Worker имя, например `hse-law-prep-ai`.
4. В редакторе кода замените содержимое на код из файла `workers/ai-proxy.js` в репозитории.
5. Нажмите **Save and deploy**.
6. Скопируйте URL Worker (например, `https://hse-law-prep-ai.your-subdomain.workers.dev`).

## Шаг 3: Добавить секреты и переменные

1. В настройках Worker перейдите в **Settings** → **Variables and Secrets**.
2. Нажмите **Add**.
3. Создайте секрет:
   - **Variable name**: `OPENROUTER_API_KEY`
   - **Value**: ваш ключ из OpenRouter
   - **Encrypt**: включено (🔒)
4. Создайте переменную:
   - **Variable name**: `ALLOWED_ORIGINS`
   - **Value**: список источников через запятую, например:
     ```
     https://realfactchecknews-eng.github.io,http://localhost:8000
     ```
   - **Encrypt**: выключено
5. Нажмите **Deploy**.

## Шаг 4: Указать URL прокси на сайте

1. Откройте файл `js/config.js` в репозитории.
2. Замените значение `AI_PROXY_URL` на URL вашего Worker:
   ```js
   const SITE_CONFIG = {
     AI_PROXY_URL: 'https://hse-law-prep-ai.your-subdomain.workers.dev'
   };
   ```
3. Закоммитьте и запушьте изменения.

## Шаг 5: Проверить работу

1. Откройте сайт.
2. Нажмите на кнопку **AI-юрист** в правом нижнем углу.
3. Задайте вопрос, например: «Что такое правовая норма?»
4. Если всё настроено правильно, через несколько секунд придёт ответ.

## Ограничения и безопасность

- История чата хранится только в браузере пользователя (`localStorage`).
- Ключ OpenRouter не виден посетителям сайта.
- Для дополнительной защиты можно включить rate limiting в Cloudflare (например, не более 30 запросов в час с одного IP).
- Используется модель `openai/gpt-4o-mini` — дешёвая и достаточно качественная для юридических вопросов. При желании можно заменить в `workers/ai-proxy.js`.

## Что делать, если не работает

- Откройте DevTools → Console на сайте и посмотрите ошибки.
- В Cloudflare Dashboard откройте **Real-time logs** Worker и проверьте запросы.
- Убедитесь, что `ALLOWED_ORIGINS` содержит точный URL сайта (с `https://`).
- Убедитесь, что `OPENROUTER_API_KEY` добавлен как **Encrypted** секрет.

## Модель и стоимость

- Модель по умолчанию: `openai/gpt-4o-mini`.
- Стоимость OpenRouter: <https://openrouter.ai/models/openai/gpt-4o-mini>
- 1000 вопросов обходятся примерно в $0.30–$0.60.
- Если хотите ещё дешевле, можно заменить на `meta-llama/llama-3.1-8b-instruct` или `google/gemini-flash-1.5` в `workers/ai-proxy.js`.
