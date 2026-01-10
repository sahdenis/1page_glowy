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

// --- ЗАДАЧА 2: Отправка в GOOGLE SHEETS ---
            if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith('http')) {
                // ИСПОЛЬЗУЕМ URLSearchParams ВМЕСТО FormData
                const params = new URLSearchParams();
                
                // Важно: Имена ключей ('Name', 'Phone') должны ТОЧНО совпадать 
                // с заголовками в первой строке вашей Google Таблицы!
                params.append('Date', new Date().toLocaleString());
                params.append('Product', fullItemName);
                params.append('Price', currentPrice);
                params.append('Name', name);
                params.append('Phone', phone);
                params.append('Email', email);
                params.append('Message', address);

                const sheetPromise = fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: params, // Отправляем как параметры URL
                    mode: 'no-cors' 
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