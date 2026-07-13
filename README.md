# Personal Expenditure Tracker

A simple, mobile-first web app for Vinod Kumar to track daily expenses across multiple business sectors.

## Features

- **Quick entry form**: sector chips, reason, amount, transferred-to, date/time
- **Pre-loaded sectors**: VGrand Restaurant, VGrand Infra, VGrand Healthcare, Mining, Softshape.ai
- **Add custom sectors** any time via the "+ New" chip
- **Auto-download receipt image** on every save using `html2canvas`
- **Tap-to-share** any past entry via WhatsApp (Web Share API fallback included)
- **History grouped by day** with date-range filters (Today, This Week, This Month, Custom)
- **Running total + per-sector breakdown** for the selected range
- **Daily report** summary that can be shared with one tap

## Tech stack

- React + Vite
- Tailwind CSS
- html2canvas (receipt image generation)
- lucide-react (icons)
- localStorage (offline-first data persistence)

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`) in your browser.

## Build for production

```bash
npm run build
```

The `dist/` folder will contain the static site.

## Firebase setup (optional, for cross-device sync)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Add a **Web app** and copy the SDK config values.
3. Create a file named `.env` in the project root (copy from `.env.example`) and paste the values.
4. In Firebase Console, enable **Firestore Database**.
5. Use these starter security rules (they are intentionally permissive; tighten them if you add authentication):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sync/{doc} {
      allow read, write: if true;
    }
  }
}
```

The app will:
- Use Firestore when the `.env` config is present and valid.
- Fall back to `localStorage` when Firebase is not configured (so it still works offline).

## Notes on WhatsApp auto-send

A browser tab cannot send WhatsApp messages automatically while closed. The current app generates a daily summary and opens the system share sheet / WhatsApp share URL for one-tap sending. For fully automated nightly reports, a small backend (e.g., Firebase Cloud Function + WhatsApp Cloud API) would be required.
