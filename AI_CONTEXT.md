# Контекст проекта для AI-ассистента

## Что это за проект
Статический сайт-платформа для подготовки к олимпиадам по праву (Высшая проба, ВСОШ, РСОШ) и поступления на юриспруденцию в ВШЭ и другие вузы. Контент берётся из PDF-презентаций онлайн-школы «Общее дело» и учебников по ТГП. Сайт развёртывается на GitHub Pages.

## Репозиторий и деплой
- GitHub: `https://github.com/realfactchecknews-eng/hse-law-prep.git`
- GitHub Pages: `https://realfactchecknews-eng.github.io/hse-law-prep/`
- AI-прокси (Netlify): `https://pravo-olymp.netlify.app` (функция `netlify/functions/chat.js`)
- Кастомный домен (в процессе): `pravolymp.ru` — куплен на reg.ru, добавлен в Netlify, DNS ещё не настроен на reg.ru

## ⚠️ Что сейчас делается (незавершено)
Подключение кастомного домена `pravolymp.ru` к Netlify чтобы AI-юрист работал без VPN в России.

### Статус:
- `pravolymp.ru` добавлен в Netlify → Site configuration → Domain management
- Netlify показывает "Pending DNS verification" — нужно добавить DNS-записи на reg.ru
- После добавления DNS-записей нужно обновить `js/config.js`: заменить `AI_PROXY_URL` на `https://pravolymp.ru`

### Следующие шаги:
1. В Netlify нажать **Pending DNS verification** у `pravolymp.ru` → посмотреть какие записи нужны
2. Зайти на reg.ru → Мои домены → pravolymp.ru → DNS → добавить записи от Netlify
3. Подождать 15-60 минут пока DNS обновится
4. Обновить `js/config.js`: `AI_PROXY_URL: 'https://pravolymp.ru'`
5. Закоммитить и запушить, смержить в main

## Почему переехали с Cloudflare на Netlify
`.workers.dev` домены заблокированы у многих российских провайдеров. Netlify тоже оказался заблокирован, поэтому купили кастомный домен `pravolymp.ru`.

## Структура AI-прокси (актуальная)
- `netlify/functions/chat.js` — серверная функция (заменила Cloudflare Worker)
- `netlify.toml` — редирект `/api/chat` → `/.netlify/functions/chat`
- `api/chat.js`, `vercel.json` — остались в репо, не используются (пробовали Vercel, отказались)
- Переменные окружения в Netlify: `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS`

## Структура проекта
```
hse-law-prep/
├── index.html                # Главная страница, SPA-оболочка
├── css/style.css             # Стили, включая стили чата
├── js/
│   ├── app.js                # Роутинг, рендер, тесты, прогресс, AI-чат
│   ├── data.js               # Все данные: олимпиады, вузы, темы, тесты
│   └── config.js             # URL AI-прокси и название ассистента
├── workers/
│   └── ai-proxy.js           # Cloudflare Worker для безопасного вызова OpenRouter
├── .github/workflows/
│   └── check_olympiads.yml   # GitHub Actions для проверки сайтов олимпиад
├── scripts/
│   └── check_olympiads.py    # Скрипт проверки хешей сайтов олимпиад
├── .olympiad-snapshots.json  # Снепшоты хешей сайтов олимпиад
├── assets/
│   ├── logo.svg              # Логотип сайта
│   ├── favicon.svg/.png/.ico # Favicon
│   ├── pdfs/                 # Исходные PDF-презентации (НЕ в git)
│   └── slides/               # Извлечённые слайды/картинки (НЕ в git)
├── data/                     # Рабочие JSON-файлы (НЕ в git)
├── README.md                 # Краткое описание для пользователя
├── PROJECT.md                # Полное описание для разработчика
├── AI_CHAT_SETUP.md          # Инструкция по настройке AI-юриста
├── AI_CONTEXT.md             # Этот файл
└── .gitignore                # Исключает assets/pdfs/, assets/slides/, data/expanded_*.json
```

## Технологии
- Чистый HTML/CSS/JS, без сборки, без фреймворков.
- Данные хранятся в `js/data.js` как JavaScript-объект `APP_DATA`.
- SPA-роутинг через хеш (`#topics`, `#tests`, `#topic/id`, `#test/id`, `#olympiads`, `#universities`, `#progress`, `#chat`).
- `localStorage`:
  - `law-prep-progress` — прогресс тестов.
  - `law-prep-ai-chat` — история сообщений AI-чата.
- AI-ассистент работает через OpenRouter API, проксируется через Cloudflare Worker. Модель: `openai/gpt-4o-mini`.

## Ключевые данные в `js/data.js`
- `olympiads`: массив из 15 олимпиад с уровнями РСОШ, льготами, сроками, ссылками.
- `universities`: массив из 17 вузов с программами, экзаменами, проходными баллами, олимпиадами.
- `topics`: массив из 22 тем (16 по ТГП + 6 по конституционному праву).
- `tests`: массив из 22 тестов. ТГП-тесты по 12–13 вопросов, конституционные — по 3 вопроса.

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
        {"id": "a2", "text": "Ответ 2", "correct": true},
        ...
      ],
      "explanation": "Пояснение"
    }
  ]
}
```

## Что уже сделано
1. Создан и настроен репозиторий на GitHub.
2. Извлечён текст из 4 PDF по ТГП, 5 PDF по конституционному праву, учебников Морозовой и Матузова-Малько, а также юридического словаря терминов ВсОШ.
3. Добавлены 22 темы и 22 теста.
4. Добавлены 15 олимпиад и 17 вузов.
5. Настроена навигация и сохранение прогресса.
6. Добавлен логотип и favicon.
7. Добавлен AI-ассистент (юрист) в виде плавающего чата на всех вкладках.
   - Прокси на Cloudflare Worker: `workers/ai-proxy.js`.
   - URL Worker указан в `js/config.js`.
   - Модель `openai/gpt-4o-mini` через OpenRouter.
   - Системный промпт ужесточён: запрет на выдумывание, выход из роли, ответы только по праву/юриспруденции/олимпиадам/поступлению.
8. Добавлен GitHub Actions workflow для проверки сайтов олимпиад.
9. Проведена проверка достоверности и исправлены найденные ошибки:
   - уровень Всероссийской олимпиады имени Вернадского по экономике (1 вместо 2);
   - возраст и льготы Высшей пробы по профилю «Право»;
   - экзамены и проходной балл ВШЭ;
   - название РАНХиГС (вместо РАНХиГУ/РАНЭПА).

## Как добавлять новый контент
1. Пользователь кладёт PDF-презентации в `/Users/jopabobra332/hse-law-prep/assets/pdfs/`.
2. Извлечь текст из PDF с помощью `pdfplumber` (Python):
   ```bash
   python3 -c "
   import pdfplumber, json
   pages = []
   with pdfplumber.open('assets/pdfs/имя_файла.pdf') as pdf:
       for i, p in enumerate(pdf.pages):
           text = p.extract_text()
           if text:
               pages.append({'page': i+1, 'text': text})
   print(json.dumps(pages, ensure_ascii=False, indent=2))
   " > data/extracted.json
   ```
3. Проанализировать текст, структурировать темы и составить тесты.
4. Добавить темы в `APP_DATA.topics` и тесты в `APP_DATA.tests` в `js/data.js`.
5. Проверить валидность `data.js` (JSON5) и запушить в `main`.
6. Убедиться, что `assets/pdfs/`, `assets/slides/` и `data/expanded_*.json` не попадают в git (уже в `.gitignore`).

## Как работает AI-ассистент
- В `js/app.js` есть функции `sendChatMessage`, `appendChatMessage`, `renderChat`.
- `js/config.js` содержит `AI_PROXY_URL` и `AI_NAME`.
- При отправке сообщения фронт собирает историю из `localStorage`, добавляет системный промпт и отправляет POST на `AI_PROXY_URL`.
- Worker `workers/ai-proxy.js`:
  - читает секрет `OPENROUTER_API_KEY` из Cloudflare;
  - добавляет CORS-заголовки;
  - отправляет запрос в `https://openrouter.ai/api/v1/chat/completions`;
  - возвращает ответ и использование токенов.
- Для локальной разработки фронт тоже обращается к Worker (не хранит API-ключ в коде).
- История чата хранится в `localStorage` (`law-prep-ai-chat`).
- Чтобы сменить модель, отредактируйте `model` в `workers/ai-proxy.js` и перезалейте Worker.
- Стоимость: `gpt-4o-mini` стоит ~$0.15/$0.60 за 1 млн токенов вход/выход. Личное использование — несколько долларов в месяц.

## Важные ограничения и замечания
- **Только реальная информация из презентаций и официальных сайтов.** Не выдумывать данные.
- Проходные баллы ЕГЭ в `budgetEge` — **примерные ориентиры**, не официальные прогнозы.
- Статусы олимпиад и сроки сделаны универсальными, без жёсткой привязки к датам, чтобы сайт не устаревал.
- Сайт не должен содержать политических оценок — только юридические факты.
- Для проверки сайтов олимпиад используется сравнение хешей, а не парсинг дат.
- `data.js` — единственный источник данных для frontend. Не хранить данные в HTML.
- AI-ассистент должен отвечать только по праву, юриспруденции, олимпиадам и поступлению. Не давать официальных юридических заключений.

## Как проверить работу сайта локально
```bash
cd /Users/jopabobra332/hse-law-prep
python3 -m http.server 8000
# открыть http://localhost:8000/
```

## Как проверить валидность data.js
```bash
python3 -c "
import json5, re
with open('js/data.js') as f: t = f.read()
m = re.search(r'const APP_DATA = (\\{.*?\\});\\s*$', t, re.DOTALL)
data = json5.loads(m.group(1))
print('OK:', len(data['topics']), 'topics,', len(data['tests']), 'tests,', len(data['olympiads']), 'olympiads,', len(data['universities']), 'universities')
"
```

## Как проверить AI-прокси
```bash
curl -X POST https://hse-law-prep-ai.realfactchecknews.workers.dev/ \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"system","content":"Ты юридический консультант."},{"role":"user","content":"Что такое ТГП?"}]}'
```

## Следующие возможные шаги
- Добавить новые блоки: административное, уголовное, гражданское, процессуальное право.
- Улучшить дизайн, добавить поиск/фильтры тем и олимпиад.
- Добавить больше тестовых вопросов, особенно к конституционным тестам.
- Обновить проходные баллы вузов по данным 2026 года.
- Добавить темную/светлую тему.
- Добавить AI-режим «объясни тему простыми словами» или «сгенерируй тест».
- Автоматически проверять ссылки на официальные сайты олимпиад.

## Контактная информация
- Проект делает ученик лицея НИУ ВШЭ для подготовки к олимпиадам по праву.
- Целевая аудитория: школьники 7–11 классов в России, готовящиеся к олимпиадам и поступлению на юриспруденцию.
- Источники: PDF-презентации «Общее дело», учебники Морозовой и Матузова-Малько по ТГП, официальные сайты олимпиад и вузов.
