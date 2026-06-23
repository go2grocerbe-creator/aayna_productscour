# AAYNA Product Scout Agent

A lightweight MVP for helping the AAYNA team manually evaluate, score, and shortlist product candidates from SkyBuyBD, AliExpress, and other sourcing platforms.

This version does not scrape websites, bypass login/CAPTCHA/anti-bot systems, or place orders. It is a human approval dashboard only.

## Recommended Tech Stack

- Frontend: HTML, CSS, and beginner-friendly vanilla JavaScript
- Local development: Vite
- Storage: Browser `localStorage` for the MVP
- Export: Client-side CSV download
- Future AI/API work: Add a backend before using API keys

## Features

- Product candidate form with source, pricing, supplier, material, score, and notes fields
- Cost calculator for supplier price in BDT, landed cost, suggested selling price, profit, and margin
- Rule-based scoring placeholder out of 100
- Decision rules for Buy, Maybe, Price Review, and Reject
- Dashboard metrics for counts, budget, top products, partner review, and website upload readiness
- Product list filters for decision, category, source, score, price, approved, watchlist, and rejected
- Product actions: approve, reject, watchlist, edit, and delete
- CSV export for approved products

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
git init
git add .
git commit -m "Build AAYNA Product Scout MVP"
git branch -M main
git remote add origin https://github.com/go2grocerbe-creator/aayna_productscour.git
git push -u origin main
```

If the remote already has files, clone it first and copy this project into the cloned folder before committing.

## Next After MVP

- Replace localStorage with a real database such as Supabase, Firebase, or PostgreSQL
- Add authentication and role-based approvals for partners/team members
- Add a backend API for secure AI scoring with OpenAI, Claude, or Gemini
- Add image upload instead of image URL only
- Add purchase planning reports and supplier comparison
- Add website upload workflow fields such as SEO title, product description, tags, and final photos
