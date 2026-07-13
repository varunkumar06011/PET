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

## Notes on WhatsApp auto-send

A browser tab cannot send WhatsApp messages automatically while closed. The current app generates a daily summary and opens the system share sheet / WhatsApp share URL for one-tap sending. For fully automated nightly reports, a small backend (e.g., Supabase Edge Function + WhatsApp Cloud API) would be required.
