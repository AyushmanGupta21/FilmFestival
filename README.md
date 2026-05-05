# 🎬 Film Festival 2026 — QR Attendance System

A zero-cost, fully automated attendance management system built for a college film festival using **Google Workspace** + **Next.js** on **Vercel**.

## How It Works

```
Student fills Google Form
        ↓
Apps Script sends QR-code email (Student ID encoded in QR)
        ↓
Guard opens Vercel scanner on phone
        ↓
Scans QR → /api/scan (Next.js proxy)
        ↓
Apps Script marks "Yes" in Google Sheet (Attendance column)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Data collection | Google Forms |
| Database | Google Sheets |
| Backend / Email | Google Apps Script |
| Frontend | Next.js 16 (App Router) |
| Hosting | Vercel (free tier) |

## Project Structure

```
FilmFest/
├── app/
│   ├── api/
│   │   └── scan/
│   │       └── route.js     # Proxy: Vercel → Apps Script (avoids CORS)
│   ├── globals.css          # Design system & all styles
│   ├── layout.js            # Root layout with Inter font
│   └── page.jsx             # Scanner UI (React, client-side)
├── scripts/
│   └── Code.gs              # Google Apps Script — paste into Apps Script editor
├── docs/
│   └── SETUP.md             # Full setup guide
├── .env.example             # Environment variable template
├── package.json
└── README.md
```

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/AyushmanGupta21/FilmFestival.git
cd FilmFestival
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local and paste your Apps Script Web App URL
```

### 3. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel
- Connect repo on [vercel.com](https://vercel.com)
- Set `APPS_SCRIPT_WEBAPP_URL` in Vercel Environment Variables
- Deploy

See [`docs/SETUP.md`](docs/SETUP.md) for the full step-by-step guide.

## Environment Variables

| Variable | Description |
|---|---|
| `APPS_SCRIPT_WEBAPP_URL` | Your deployed Google Apps Script Web App URL |

## License
MIT
