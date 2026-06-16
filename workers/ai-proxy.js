// Cloudflare Worker: прокси для OpenRouter AI-чата
// Настройка:
// 1. Создайте Worker в Cloudflare Dashboard.
// 2. Добавьте секрет OPENROUTER_API_KEY через Settings → Variables → Add → Encrypt.
// 3. Добавьте переменную ALLOWED_ORIGINS со списком разрешённых источников через запятую
//    (например: "https://realfactchecknews-eng.github.io,http://localhost:8000").
// 4. Вставьте этот код в редактор Worker.
// 5. Скопируйте URL Worker и укажите его в js/config.js на сайте.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

function handleCORS(request, env) {
  const origin = request.headers.get('Origin') || '*';
  if (!isAllowedOrigin(origin, env)) {
    return new Response('Origin not allowed', { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleChat(request, env) {
  const origin = request.headers.get('Origin') || '*';
  if (!isAllowedOrigin(origin, env)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403, origin);
  }

  try {
    const body = await request.json();
    const messages = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ error: 'Messages are required' }, 400, origin);
    }

    const openRouterKey = env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return jsonResponse({ error: 'OpenRouter API key is not configured' }, 500, origin);
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://realfactchecknews-eng.github.io/hse-law-prep/',
        'X-Title': 'Право olymp AI',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: messages,
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return jsonResponse({ error: `OpenRouter error: ${response.status}`, details: errorText }, 502, origin);
    }

    const data = await response.json();
    return jsonResponse(data, 200, origin);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500, origin);
  }
}

function jsonResponse(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    },
  });
}

function isAllowedOrigin(origin, env) {
  if (!origin || origin === 'null') return false;
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowed.length === 0) return true; // если не настроено — разрешить всё (только для теста)
  return allowed.some(a => origin === a || origin.endsWith(a));
}
