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

  // --- 1. Telegram (Оставляем JSON) ---
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

  // --- 2. Google Sheets (МЕНЯЕМ НА URLSearchParams) ---
  // Это решает проблему пустых строк. Мы конвертируем объект в формат: Name=Ivan&Phone=123...
  if (GOOGLE_URL && sheetData) {
    // Превращаем объект в параметры
    const params = new URLSearchParams();
    for (const key in sheetData) {
      params.append(key, sheetData[key]);
    }

    const sheetPromise = fetch(GOOGLE_URL, {
        method: "POST",
        // Google Script обожает этот формат
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(), 
    }).then(async (apiRes) => {
        if (!apiRes.ok) console.warn(`Google Warning: ${apiRes.statusText}`);
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