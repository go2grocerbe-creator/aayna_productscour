# AAYNA Product Scout Agent

A web app MVP based on the AAYNA Product Scout Lite workbook. It helps the AAYNA team manually scout, score, approve, order, QC, and prepare women’s accessories products for website upload.

This app does not scrape SkyBuyBD, AliExpress, 1688, or any sourcing site. It does not bypass login, CAPTCHA, or anti-bot systems. It does not auto-order products. It is a human decision-support tool only.

## Recommended Tech Stack

- Frontend: HTML, CSS, and beginner-friendly vanilla JavaScript
- Local development: Vite
- MVP storage: Browser `localStorage`
- Export: Client-side CSV download
- Future AI/API work: Add a backend before using API keys

## Workbook Logic Implemented

- Product Tracker-style candidate fields
- Workbook-style cost calculations:
  - Unit cost in BDT
  - Estimated landed cost
  - Suggested selling price
  - Expected profit
  - Profit margin
  - Total purchase cost
  - Actual landed cost
  - Actual profit
  - Actual profit margin
  - Final stock accepted
- AAYNA weighted 10-criteria scoring system:
  - Feminine
  - Trendy
  - AAYNA aesthetic fit
  - Easy to style
  - Lightweight
  - Good for reels/photos
  - Giftability
  - Price fit
  - Demand
  - Quality/risk
- Decision rules:
  - `80+` = Buy
  - `65-79` = Maybe
  - Below `65` = Reject
  - Suggested selling price over `BDT 700` = Price Review
  - Suggested selling price over `BDT 1000` = Reject
  - Quality/risk score `<= 2` prevents Buy
  - AAYNA aesthetic fit score `<= 2` prevents Buy
- Dashboard KPIs:
  - Total products
  - Buy, Maybe, Price Review, Reject counts
  - Approved purchase cost
  - Remaining budget
  - Budget used %
  - Website-ready products
  - High-risk products
  - Products needing partner review
- Product actions:
  - Approve
  - Reject
  - Watchlist
  - Edit
  - Delete
  - Mark ordered
  - Mark arrived
  - Mark website ready
- Website-ready approved product CSV export
- Settings page for exchange rates, markup, price ceilings, budget, low-profit threshold, MOQ warning threshold, default customs, and default misc fee

## Local Setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

## Environment Variables

Copy `.env.example` to `.env` when you add a backend later:

```bash
cp .env.example .env
```

Do not put real AI API keys in frontend code. Browser users can inspect frontend bundles, so OpenAI, Anthropic, Gemini, and similar keys must stay on a server.

## Manual GitHub Push

```bash
git add .
git commit -m "Implement workbook-based Product Scout MVP"
git push
```

## Next After MVP

- Replace localStorage with a shared database such as Supabase, Firebase, or PostgreSQL
- Add authentication and role-based approval permissions
- Add image uploads and product photo management
- Add a backend API for secure AI scoring with OpenAI, Claude, or Gemini
- Add audit history for score changes, approvals, orders, arrivals, and QC
- Add supplier comparison and purchase planning reports
- Add website CMS integration for pushing approved product data
