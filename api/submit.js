// api/submit.js
export default async function handler(req, res) {
  // 1. Читаем переменные окружения из Vercel
  const TG_TOKEN = process.env.TG_TOKEN_VAR;
  const TG_CHAT_ID = process.env.TG_CHAT_ID_VAR;
  const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL_VAR;

  if (!TG_TOKEN || !TG_CHAT_ID) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  // 2. Получаем данные от index.html
  const { message, sheetData } = req.body;

  const tasks = [];

  // --- Задача A: Отправка в Telegram ---
  const tgPromise = fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  }).then(async (apiRes) => {
      if (!apiRes.ok) throw new Error(`TG Error: ${apiRes.statusText}`);
      return apiRes;
  });
  tasks.push(tgPromise);

  // --- Задача B: Отправка в Google Sheets ---
  if (GOOGLE_URL) {
    // Google Script (updated) ждет JSON
    const sheetPromise = fetch(GOOGLE_URL, {
        method: "POST",
        body: JSON.stringify(sheetData),
        // Важно: text/plain позволяет избежать лишних CORS проверок со стороны Google
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    }).then(async (apiRes) => {
        // Google Script часто возвращает 302 redirect, fetch следует за ним автоматически
        if (!apiRes.ok) console.warn(`Google Sheet Warning: ${apiRes.statusText}`);
        return apiRes;
    });
    tasks.push(sheetPromise);
  }

  try {
    await Promise.allSettled(tasks);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}