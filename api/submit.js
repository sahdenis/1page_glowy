// api/submit.js
export default async function handler(req, res) {
  const TG_TOKEN = process.env.TG_TOKEN_VAR;
  const TG_CHAT_ID = process.env.TG_CHAT_ID_VAR;
  const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL_VAR;

  if (!TG_TOKEN || !TG_CHAT_ID) {
    return res.status(500).json({ error: 'Config missing' });
  }

  const { message, sheetData } = req.body;
  const tasks = [];

  // --- Telegram ---
  const tgPromise = fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  });
  tasks.push(tgPromise);

  // --- Google Sheets ---
  if (GOOGLE_URL && sheetData) {
    const sheetPromise = fetch(GOOGLE_URL, {
        method: "POST",
        // Отправляем как текст, чтобы избежать CORS и проблем с типами
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
        body: JSON.stringify(sheetData),
        redirect: 'follow' // ВАЖНО: следовать за редиректом Google
    }).then(async (apiRes) => {
        if (!apiRes.ok) console.warn(`Google Error: ${apiRes.statusText}`);
        return apiRes;
    });
    tasks.push(sheetPromise);
  }

  try {
    await Promise.allSettled(tasks);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}