# Royal Eye Wedding Car Dashboard

A fast static dashboard for Royal Eye Wedding Car. It reads booking and expense data from a Google Apps Script JSON API connected to Google Sheets.

## Files

- `index.html` - page structure and Chart.js CDN.
- `style.css` - mobile-first dashboard styling.
- `script.js` - data loading, calculations, calendar, lists, charts, and sample data.
- `google-apps-script.gs` - Google Apps Script backend code.

## Google Sheet Setup

Create two sheets with these exact names:

- `Bookings`
- `BusinessExpenses`

Use the first row as headers. The dashboard expects the booking headers `Booking ID`, `Date`, `Time Slot`, `Total Price`, `Status`, `Driver Salary`, `Fuel`, `Decoration`, `Other Job Expense`, `Other Explanation`, and `Note`.

For business expenses, use `Date`, `Expense Type`, `Amount`, and `Explanation`.

## Google Apps Script Setup

1. Open the Google Sheet.
2. Go to `Extensions` > `Apps Script`.
3. Paste the code from `google-apps-script.gs`.
4. Click `Deploy` > `New deployment`.
5. Choose `Web app`.
6. Set `Execute as` to `Me`.
7. Set `Who has access` to `Anyone`.
8. Deploy and copy the Web app URL.
9. In `script.js`, replace:

```js
const API_URL = "PASTE_GOOGLE_APPS_SCRIPT_URL_HERE";
```

with your deployed URL.

## Run Locally

From this folder:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

## Deploy

For Cloudflare Pages or Netlify, upload or connect this folder as a static site. No build command is needed. The publish directory is the project root.
