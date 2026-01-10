export default async function handler(req, res) {
  // 1. Получаем данные от фронтенда
  // message - текст для Телеграма
  // sheetData - объект с данными для Google Таблицы
  const { message, sheetData } = req.body;

  // 2. Получаем секретные ключи из Vercel
  const TG_TOKEN = process.env.TG_TOKEN_VAR;
  const TG_CHAT_ID = process.env.TG_CHAT_ID_VAR;
  const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL_VAR; // Новый секретный ключ

  if (!TG_TOKEN || !TG_CHAT_ID) {
    return res.status(500).json({ error: 'Telegram configuration missing' });
  }

  const tasks = [];

  // --- Задача 1: Отправка в Telegram ---
  const tgPromise = fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  }).then(async (res) => {
      if (!res.ok) throw new Error(`Telegram Error: ${res.statusText}`);
      return res;
  });
  tasks.push(tgPromise);

  // --- Задача 2: Отправка в Google Sheets (если URL задан) ---
  if (GOOGLE_URL && sheetData) {
    const sheetPromise = fetch(GOOGLE_URL, {
        method: "POST",
        body: JSON.stringify(sheetData),
        // Используем text/plain, чтобы избежать проблем с CORS и preflight (стандарт для Google Scripts)
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    }).then(async (res) => {
        if (!res.ok) throw new Error(`Google Sheet Error: ${res.statusText}`);
        return res;
    });
    tasks.push(sheetPromise);
  }

  try {
    // Ждем выполнения всех задач
    await Promise.all(tasks);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}