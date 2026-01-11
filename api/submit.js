var SHEET_NAME = "Sheet1";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  // Сразу получаем лист, чтобы иметь возможность записать ошибку
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName(SHEET_NAME);

  try {
    // 1. СМОТРИМ, ЧТО ПРИШЛО (Чтение данных)
    var data = {};
    
    // Если пришел JSON (самый частый вариант от Vercel)
    if (e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        // Проверяем, вложены ли данные или они "плоские"
        data = parsed.sheetData ? parsed.sheetData : parsed;
      } catch (jsonErr) {
        // Если не JSON, пробуем считать как обычный текст (на всякий случай)
        console.log("Not JSON");
      }
    } 
    
    // Если data всё еще пустая, пробуем параметры URL
    if (Object.keys(data).length === 0 && e.parameter) {
      data = e.parameter;
    }

    // 2. ПОДГОТОВКА СТРОКИ
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;

    var newRow = headers.map(function(header) {
      if (header === 'Date') return new Date();
      // Ищем значение. Если ключа нет, пишем пустую строку, НО не null
      return data[header] || "";
    });

    // 3. ЗАПИСЬ
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // === БЛОК ПЕРЕХВАТА ОШИБОК ===
    // Если скрипт упал, мы запишем ошибку в таблицу, чтобы вы ее увидели
    var errorRow = [new Date(), "ОШИБКА СКРИПТА", err.toString(), e ? JSON.stringify(e.postData) : "No Data", "", "", ""];
    // Пытаемся записать хотя бы ошибку
    sheet.appendRow(errorRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function setup() {
  // Заголовки (запустите один раз, если их нет)
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  sheet.getRange(1, 1, 1, 7).setValues([["Date", "Product", "Price", "Name", "Phone", "Email", "Message"]]);
}