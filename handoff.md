# 🎬 Film Festival Ticket & Attendance System — Context & Handoff

## 📌 Project Overview
We are building a zero-cost digital ticketing and attendance system for a college film festival using Google Workspace (Forms + Sheets) as the database and email server, and a custom web application for security guards to scan QR codes at the gates.

## 🏗️ Architecture
1. **Database & Data Collection**: Google Forms + Google Sheets. Only 1 response allowed per email to prevent duplicate QR codes.
2. **Backend (Google Apps Script)**: 
   - Uses an `onFormSubmit` trigger that catches new registrations, fetches a customized QR code (encoding the `Student ID`) via a free API (QuickChart), and embeds it in a styled HTML email to the student.
   - Contains a `doGet(e)` function deployed as a **Google Apps Script Web App** acting as a REST API. When called with `?action=scan&id=STUDENT_ID`, it uses `LockService` to prevent race conditions, searches the Google Sheet for the ID, and marks "Present" in the Attendance column (Column I / col 9).
3. **Frontend (Vercel-hosted Web App)**:
   - A mobile-friendly web page using `html5-qrcode` to access the smartphone camera.
   - Scans the QR and calls the backend API to grant entry, detect duplicates, or catch invalid IDs.

## ✅ What Has Been Accomplished
- The Apps Script `Code.gs` is fully written and correctly connected. Form submissions reliably generate QR codes and send properly formatted emails.
- Apps Script Web App deployed successfully and can mark students "Present" in the spreadsheet without race conditions.
- Frontend UI (`index.html`) styling and scanner logic are fully built, featuring stats tracking, scan logs, and visual/haptic feedback.
- Migrated the frontend hosting from Apps Script to **Vercel** (`index.html` + `vercel.json`).

## 🛑 Current Errors & Blockers
While deploying the frontend on Vercel, the browser's `fetch()` call to the Google Apps Script Web App URL ran into **CORS (Cross-Origin Resource Sharing) blocked errors** because Google redirects Apps Script API responses.

To solve this, we attempted to create a Vercel Serverless Function proxy (`api/scan.js`) so the frontend would call the Vercel backend (`/api/scan`), which would safely call Google Apps Script server-side. However, a **"Connection Error" (HTTP 500)** is occurring on the scanner.

**The root cause of the current error:**
The `api/scan.js` was written using ES6 Module syntax (`export default async function handler...`) but the Vercel project is just a static HTML folder without a `package.json` to define `"type": "module"`. Vercel therefore tries to run it as CommonJS and crashes.

## ⏭️ Next Steps / How to Proceed
The user asked: *"can it be done in next js? if it solves the problem"*

Yes! Moving to **Next.js** handles API routes out-of-the-box perfectly and will absolutely solve the Vercel proxy issues. 

**Instructions for the Next AI Agent:**
1. Initialize a lightweight Next.js app (App Router) in the directory (`D:\FilmFest`).
2. Move the UI from `index.html` into `app/page.jsx` as a React Component (reusing the existing CSS concepts and `html5-qrcode` logic via `useEffect`).
3. Move the backend proxy logic from `api/scan.js` into a Next.js Route Handler (`app/api/scan/route.js`).
4. Ensure the React fetch logic points securely to `/api/scan`.
5. No changes are required in `Code.gs` or Google Sheets, the Apps Script backend works perfectly.
