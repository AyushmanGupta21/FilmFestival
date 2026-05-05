# Setup Guide — Film Festival QR Attendance System

## Prerequisites

- Google account with access to Google Forms, Sheets & Apps Script
- GitHub account
- Vercel account (free)
- Node.js 18+ (for local dev only)

---

## Step 1 — Google Form & Sheet

1. Create a **Google Form** with these fields:
   - Name
   - Email
   - Student ID
   - Department
   - WhatsApp Number
   - Which College?

2. In Form settings → **Responses** → enable **"Limit to 1 response"** to prevent duplicate QR codes.

3. Click **Link to Sheets** — this creates your database spreadsheet.

4. In the linked Sheet, add a header **`Attendance`** in column I and **`Attended At`** in column J.

---

## Step 2 — Google Apps Script

1. In the linked Google Sheet → **Extensions → Apps Script**.

2. Delete all default code. Copy the entire contents of `scripts/Code.gs` from this repo and paste it in.

3. Click **Save** (💾).

4. Set up the trigger:
   - Left sidebar → **Triggers (⏰)** → **+ Add Trigger**
   - Function: `onFormSubmit`
   - Event source: **From spreadsheet**
   - Event type: **On form submit**
   - Save → authorize when prompted

5. Deploy as Web App:
   - **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** → copy the `...exec` URL

---

## Step 3 — Local Development

```bash
# 1. Clone
git clone https://github.com/AyushmanGupta21/FilmFestival.git
cd FilmFestival

# 2. Install dependencies
npm install

# 3. Set environment variable
cp .env.example .env.local
# Open .env.local and paste the Apps Script Web App URL

# 4. Run dev server
npm run dev
# Open http://localhost:3000
```

---

## Step 4 — Deploy to Vercel

1. Push code to GitHub (already done if you cloned this repo).

2. Go to [vercel.com/new](https://vercel.com/new) → **Import** the `FilmFestival` repo.

3. Framework: **Next.js** (auto-detected).

4. Under **Environment Variables**, add:
   - Key: `APPS_SCRIPT_WEBAPP_URL`
   - Value: your Apps Script `...exec` URL

5. Click **Deploy**.

---

## How Attendance Works

| QR content | Result |
|---|---|
| Valid Student ID, first scan | Writes "Yes" + timestamp to sheet → **Entry Granted** |
| Valid Student ID, already scanned | No change to sheet → **Already Admitted** |
| Unknown ID | No change to sheet → **Not Registered** |

The QR code encodes just the **Student ID** (e.g. `231003003123`).

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Connection Error on scanner | Check `APPS_SCRIPT_WEBAPP_URL` in Vercel env vars |
| No email received after form submit | Check the `onFormSubmit` trigger is set up in Apps Script |
| "Not Registered" for a valid student | Ensure Student ID in QR matches exactly what's in column F of the sheet |
| Attendance column not updating | Make sure column I header is exactly `Attendance` |
