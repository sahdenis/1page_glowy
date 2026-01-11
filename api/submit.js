// api/submit.js

// ИСПОЛЬЗУЕМ module.exports ВМЕСТО export default
module.exports = async (req, res) => {
  
  // 0. Настройка CORS (чтобы браузер не блокировал запросы)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Если это предварительный запрос (OPTIONS), сразу отвечаем ОК
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. Проверяем переменные окружения
    const TG_TOKEN = process.env.TG_TOKEN_VAR;
    const TG_CHAT_ID = process.env.TG_CHAT_ID_VAR;
    const GOOGLE_URL = process.env.GOOGLE_SCRIPT_URL_VAR;

    if (!TG_TOKEN || !TG_CHAT_ID) {
      console.error("Missing ENV variables");
      return res.status(500).json({ 
        error: 'Config Error', 
        details: 'TG_TOKEN_VAR or TG_CHAT_ID_VAR is missing in Vercel Settings' 
      });
    }

    // 2. Безопасно парсим тело запроса
    let body = req.body;
    // Иногда Vercel передает body как строку, если заголовок не application/json
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            console.error("JSON Parse Error:", e);
        }
    }
    
    const { message, sheetData } = body || {};

    if (!message && !sheetData) {
        return res.status(400).json({ error: 'No data provided' });
    }

    const errors = [];

    // --- 3. Telegram ---
    if (message) {
        try {
            const tgRes = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TG_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
            
            if (!tgRes.ok) {
                const errText = await tgRes.text();
                console.error("TG Error:", errText);
                errors.push(`Telegram: ${tgRes.status} ${errText}`);
            }
        } catch (e) {
            console.error("TG Network Error:", e);
            errors.push(`Telegram Net: ${e.message}`);
        }
    }

    // --- 4. Google Sheets ---
    if (GOOGLE_URL && sheetData) {
        try {
            // Отправляем как JSON. Убедитесь, что Google Script обновлен (см. предыдущие шаги)
            const sheetRes = await fetch(GOOGLE_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(sheetData),
                redirect: 'follow'
            });
            
            if (!sheetRes.ok) {
                console.error("Google Error:", sheetRes.status);
                errors.push(`Google: ${sheetRes.status}`);
            }
        } catch (e) {
            console.error("Google Network Error:", e);
            errors.push(`Google Net: ${e.message}`);
        }
    }

    // --- 5. Результат ---
    if (errors.length > 0) {
        return res.status(500).json({ success: false, errors: errors });
    }

    return res.status(200).json({ success: true });

  } catch (criticalError) {
    console.error("CRITICAL CRASH:", criticalError);
    return res.status(500).json({ 
        error: 'Critical Function Error', 
        message: criticalError.message 
    });
  }
};