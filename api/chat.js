// Vercel Serverless Function: прокси для OpenRouter AI-чата
// Настройка:
// 1. Задеплой репозиторий на vercel.com.
// 2. В настройках проекта → Environment Variables добавь:
//    OPENROUTER_API_KEY — твой ключ с openrouter.ai (тип Secret)
//    ALLOWED_ORIGINS    — список разрешённых источников через запятую
//                         например: https://realfactchecknews-eng.github.io,http://localhost:8000
// 3. Скопируй URL проекта и укажи его в js/config.js на сайте.

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const isAllowed = allowed.length === 0 || allowed.some(a => origin === a || origin.endsWith(a));

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!isAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(404).json({ error: 'Not Found' });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    return res.status(500).json({ error: 'OpenRouter API key is not configured' });
  }

  try {
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
        messages,
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ error: `OpenRouter error: ${response.status}`, details: errorText });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
