const SHEET_NAMES = {
  bookings: "Bookings",
  businessExpenses: "BusinessExpenses"
};

function doGet() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const payload = {
      bookings: readSheetRows(spreadsheet, SHEET_NAMES.bookings),
      businessExpenses: readSheetRows(spreadsheet, SHEET_NAMES.businessExpenses)
    };

    return jsonResponse(payload);
  } catch (error) {
    return jsonResponse({
      bookings: [],
      businessExpenses: [],
      error: error.message
    });
  }
}

function readSheetRows(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function (header) {
    return String(header).trim();
  });

  return values.slice(1)
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== "";
      });
    })
    .map(function (row) {
      const item = {};
      headers.forEach(function (header, index) {
        if (header) {
          item[header] = normalizeCell(row[index]);
        }
      });
      return item;
    });
}

function normalizeCell(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return value === null || value === undefined ? "" : value;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
