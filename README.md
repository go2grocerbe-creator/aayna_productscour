# AAYNABuyOS MVP

A lean Bangladesh-focused internal sourcing and launch-prep tool for AAYNA, built from the Product Scout workbook logic. AAYNABuyOS helps the team manually scout, score, approve, reject, order, QC, batch for launch, and prepare women's accessories products for website upload.

This app does not scrape SkyBuyBD, AliExpress, 1688, or any sourcing site. It does not bypass login, CAPTCHA, or anti-bot systems. It does not auto-order products. It is a human decision-support tool only.

## Tech Stack

- Frontend: HTML, CSS, and vanilla JavaScript
- Local development: Vite
- MVP storage: Browser `localStorage` fallback plus optional Supabase cloud database
- Export: Client-side CSV and JSON downloads
- Future AI/API work: Add a backend before using API keys

## Current Storage

BuyOS v0.4 supports two storage modes:

- `local`: browser `localStorage`, used when Supabase is not configured or the user is signed out
- `cloud`: Supabase, used only after a successful internal email/password sign-in and workspace membership lookup

Local product candidates are stored under `aaynaProducts`.
Local settings are stored under `aaynaSettings`.

Saved data uses a simple schema marker:

```text
app: AAYNABuyOS
schemaVersion: 3
```

Local mode is suitable for a single-device fallback. Clearing browser data will remove local products unless you export a backup first.

Cloud mode loads the first workspace where the signed-in Supabase Auth user is a member. The app does not auto-create workspaces. If no membership exists, it shows:

```text
No BuyOS workspace found for this account. Add the user to buyos_members in Supabase.
```

Expected workspace name:

```text
AAYNA BuyOS
```

Known workspace ID:

```text
cd97992c-d51c-496c-8c27-9bd7bc322aaf
```

## BuyOS v0.3 Adds

- Launch Batch section for approved products
- Launch status workflow:
  - shortlisted
  - sample_order
  - ordered
  - received
  - photo_ready
  - website_ready
  - live
  - paused
- Launch readiness checklist:
  - Product name
  - Description
  - Price confirmed
  - Images
  - Stock confirmed
  - Website export
  - Instagram content
- Dashboard metrics for launch batch, website-ready/live products, and photo/content pending products
- Formula-safe CSV export helper
- Internal approved/rejected CSV export
- Website-safe CSV export
- Full BuyOS JSON backup and restore
- v0.3.1 website CSV stock hardening so Stock Quantity is never blank
- v0.3.2 website CSV duplicate hardening so duplicate SKU/slug/product rows are skipped at export time

## BuyOS v0.4 Adds

- Supabase client setup through Vite environment variables
- Internal email/password sign-in using Supabase Auth
- Local/cloud storage adapter with localStorage fallback
- Workspace membership lookup through `buyos_members`
- Product rows stored in `buyos_products` with full product JSON in `data`
- Workspace settings stored in `buyos_settings.data`
- Local-to-cloud migration button in Settings
- Minimal audit events for product create/update/delete, settings update, and local migration
- JSON backup/export remains available in local and cloud mode

## BuyOS v0.4.1 Adds

- `Reload from cloud` action in the storage panel
- Cloud empty product lists stay empty instead of falling back to local demo data
- Clear local demo data utility that removes only BuyOS localStorage keys
- Duplicate workbook sample products are skipped by SKU, slug, or product name

## BuyOS v0.4.2 Troubleshooting

Cloud mode uses Supabase as the source of truth. If the SQL row count and dashboard count differ, click `Reload from cloud` in the storage panel.

After reload, the dashboard `Total products` count should match the Supabase `buyos_products` row count for the active workspace. The storage panel also shows:

- Cloud rows loaded
- Active products shown
- Local products stored
- Last cloud reload time

If Supabase returns a read/RLS error, BuyOS shows `Cloud product load failed: ...` instead of silently showing 0 products. A dashboard count of 0 should mean the cloud query succeeded and returned an empty array.

## BuyOS v0.4.3 Troubleshooting

If `Cloud rows loaded` is greater than `Active products shown`, the row mapping layer is dropping products before they reach the dashboard. BuyOS v0.4.3 maps every valid Supabase product row to one active BuyOS product.

A valid Supabase product row has an `id` and object-like `data`. The mapper does not require product name, category, score fields, launch fields, website readiness fields, or local schema metadata to exist before showing the product.

## BuyOS v0.4.4 Troubleshooting

If `Cloud products mapped` is greater than `Active products shown`, check cloud settings load/save. BuyOS v0.4.4 keeps successfully loaded cloud products even if settings loading fails.

The `buyos_settings` table uses `workspace_id` as the key, not `id`. Settings load selects `workspace_id, data`; settings save uses an upsert on `workspace_id`.

## BuyOS v0.5 Source Scout

Source Scout is an internal intake workflow for bringing product candidates into BuyOS for human review. It is not an auto-ordering bot, scraper, marketplace automation tool, CAPTCHA bypass, payment flow, or public ecommerce feature.

What it does:

- Accepts pasted product URLs and creates Pending product candidates
- Stores search keywords as scout intents for a future backend worker
- Marks imported products as `Imported - Needs Review`
- Adds draft score suggestions without replacing official scores
- Requires a human to complete costs, supplier details, ratings, scores, approval, and website readiness

Imported Source Scout products default to:

- `approvalStatus: Pending`
- `sourcingStatus: Imported - Needs Review`
- `importStatus: needs_review`
- `needsHumanReview: true`
- `importedBy: source_scout`
- blank cost, supplier, image, rating, sold count, and review fields

Draft scores are suggestions only. Use `Apply draft scores` on a product card to copy draft scores into the official editable score fields. Human approval is still required before any product can become website-ready.

Future work can add a backend metadata fetcher and backend-only AI worker. Do not put AI keys or service-role Supabase keys in frontend code.

## BuyOS v0.6.1 Source Scout SKU Safety

Source Scout imports use provisional SKUs in the `SCOUT-*` namespace, such as `SCOUT-EAR-0001`, so draft sourcing candidates cannot collide with final `AYN-*` product SKUs.

- Pending Source Scout products are marked as provisional, need human review, and cannot become website-ready.
- Final `AYN-*` SKUs are required before website export.
- The Mark website ready action is blocked until the provisional `SCOUT-*` SKU is replaced and `skuFinalized` is set to `Yes`.
- Website CSV export skips provisional Source Scout products and keeps supplier/source/cost/profit/margin/internal fields out of the public file.

## BuyOS v0.6.2 Persisted Source Scout SKUs

BuyOS repairs older pending Source Scout rows on load when they have blank, duplicate, or accidental `AYN-*` SKUs. Repaired rows get unique category-based `SCOUT-*` SKUs, such as `SCOUT-EAR-0001` and `SCOUT-EAR-0002`, and the fix is saved back to the active storage mode.

- In cloud mode, `product.data.sku` and the `buyos_products.sku` column are synced to the same `SCOUT-*` value.
- Duplicate visual `SCOUT-*` SKUs are repaired on load instead of being generated only for display.
- Existing approved, website-ready, and live products are not mutated.

## BuyOS v0.6 Source Scout Worker

BuyOS v0.6 adds a local Node worker for enriching Source Scout draft products with public page metadata. It is intentionally local/manual for now, not a cloud scheduler.

Configure a local worker env file:

```bash
cp .env.worker.example .env.worker.local
```

Fill in:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BUYOS_WORKSPACE_ID=
```

Run:

```bash
npm run scout:worker
```

Optional dry run:

```bash
npm run scout:worker -- --dry-run
```

What the worker does:

- Finds Source Scout products in `buyos_products`
- Fetches public HTML with standard `fetch`
- Reads Open Graph, Twitter card, meta description, and JSON-LD Product metadata when available
- Fills safe blank fields such as product image, rating, review count, and product name only when it is still a placeholder
- Stores listed source price separately as `listedSourcePrice`; it does not set `unitCost`
- Updates `metadataStatus`, `metadataFetchedAt`, `metadataSource`, `scoutMetadata`, `missingFields`, and draft score suggestions

What it refuses to do:

- No auto-ordering
- No auto-approval
- No CAPTCHA/login/anti-bot bypass
- No headless browser
- No aggressive retries
- No frontend secrets
- No website CSV exposure of source URLs, listed prices, costs, margins, internal notes, or draft internals

The service-role key must never be committed. `.env.worker`, `.env.worker.local`, and local env files are ignored by Git. Source Scout products remain Pending / Needs Review until a human manually completes and approves them.

## BuyOS v0.7 Search Discovery Worker

BuyOS v0.7 adds a local Search Discovery Worker so Source Scout search terms can become candidate product URLs without manually pasting every URL.

Flow:

```bash
npm run scout:discover
npm run scout:worker
```

The first command reads pending `sourceScoutTasks` from BuyOS settings, calls the configured search provider, dedupes candidate URLs, and imports safe Source Scout products. The second command enriches those imported products with public metadata.

Configure local discovery env:

```bash
cp .env.discovery.example .env.discovery.local
```

Required local/server-side variables:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BUYOS_WORKSPACE_ID=
DISCOVERY_PROVIDER=
DISCOVERY_API_KEY=
DISCOVERY_ALLOWED_DOMAINS=
DISCOVERY_MAX_RESULTS_PER_TASK=
DISCOVERY_BATCH_SIZE=
DISCOVERY_DRY_RUN=
```

Supported provider adapter names:

- `brave`
- `serpapi`
- `tavily`

Optional dry run:

```bash
npm run scout:discover -- --dry-run
```

Discovery safety rules:

- Search terms become Source Scout tasks in settings.
- Discovered candidates stay `Pending` and `Needs Review`.
- Discovered candidates use provisional `SCOUT-*` SKUs.
- Final `AYN-*` SKUs and manual approval are required before website export.
- No auto-ordering.
- No auto-approval.
- No CAPTCHA, login, anti-bot, or marketplace protection bypass.
- No frontend secrets or `VITE_` service-role variables.
- Website CSV still excludes source URLs, supplier URLs, costs, listed source price, profit, margin, internal notes, draft score metadata, discovery metadata, and search keywords.

## Launch Batch Workflow

The Launch Batch shows approved products only. A product enters the Launch Batch when it is approved, using the existing approval meaning in the app. Newly approved products default to `shortlisted`.

Use the Launch Batch to move products through:

```text
Approved product -> shortlisted -> sample order -> ordered -> received -> photo ready -> website ready -> live
```

Checklist changes and launch status changes save immediately to the active storage mode.

## Internal CSV vs Website CSV

The internal approved/rejected CSV may include sourcing and business fields such as supplier/source URL, unit cost, shipping, fees, landed cost, purchase cost, profit, margin, notes, override reason, launch status, and launch checklist.

The website CSV is intentionally safer. It does not export supplier/source URLs, unit cost, shipping, fees, customs, landed cost, purchase cost, profit, margin, internal notes, override reason, sourcing notes, or QC notes.

Website CSV only includes customer/product-upload-safe fields:

- SKU
- Slug
- Product name
- Category
- Selling price
- Stock quantity
- Image URL
- Public status
- Short description

Stock Quantity is always exported as a number. The app uses the best available public stock value and falls back to `0` when stock is missing. If any website-ready products would export with stock `0`, the app shows a warning listing the affected products/SKUs before downloading the CSV.

Website CSV export also deduplicates rows at download time. It keeps the first matching product and warns about skipped duplicates using SKU first, then slug, then product id, then normalized product name + category + selling price. This does not delete or merge products inside BuyOS.

All CSV exports quote fields, escape double quotes, preserve commas/newlines, and prefix formula-like values that start with `=`, `+`, `-`, or `@`.

## Backup and Restore

Use `Export BuyOS backup JSON` to download a full workspace backup containing products, settings, launch status, launch checklist, and schema metadata.

Use `Import BuyOS backup JSON` to restore a backup. The app validates the file first and asks for confirmation before saving the imported products/settings to the active storage mode.

Malformed JSON or invalid backup files should show an error and must not wipe current data.

## Core Workflow Features

- Product Tracker-style candidate form
- Workbook-style cost calculations
- Weighted AAYNA 10-criteria scoring
- Buy / Maybe / Price Review / Reject decision rules
- Clear computed decision reasons
- Validation for required fields, source URL, image URL, cost, price, quality scores, ratings, and quantities
- Approval override reason required before approving products rejected by status or decision
- Product actions: approve, reject, watchlist, edit, delete, mark ordered, mark arrived, mark website ready
- Website-ready approved product CSV export
- Approved/rejected internal CSV export
- Dashboard KPIs for product counts, budget, website readiness, high-risk products, partner review, and launch readiness
- Settings for exchange rates, markup, price limits, budget, low-profit threshold, MOQ warning threshold, customs, and misc fee

## Internal Data Note

This MVP is an internal AAYNABuyOS workspace. It shows supplier names, supplier/source URLs, landed cost, purchase cost, profit margin, QC notes, and internal decision notes inside the admin workflow.

There is no public customer storefront in this repo. If a public customer page is added later, do not expose supplier cost, supplier URL, sourcing links, internal notes, margin notes, or cost-price fields there.

## Local Setup

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

## Supabase Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in only browser-safe Supabase values:

```text
VITE_SUPABASE_URL=https://ynpjsqqnpnjvlxtrxwkw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

Older projects can use this fallback instead of `VITE_SUPABASE_PUBLISHABLE_KEY`:

```text
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Do not commit `.env.local`. Do not put a Supabase `service_role` key, direct database connection string, database password, or private API key in frontend env files.

The database should include these tables:

- `public.buyos_workspaces`
- `public.buyos_members`
- `public.buyos_products`
- `public.buyos_settings`
- `public.buyos_audit_events`

Create the first Supabase Auth user in the Supabase dashboard, then create or verify the `AAYNA BuyOS` workspace row and add the Auth user to `buyos_members`. The frontend intentionally does not include signup UI and does not create workspaces automatically.

## Local To Cloud Migration

When Supabase is configured, the user is signed in, and a workspace membership exists, Settings shows:

```text
Migrate local BuyOS data to cloud
```

The migration uploads local products and settings to Supabase, skips products that already match by database id, legacy id, SKU, or slug, logs `local_migrated_to_cloud`, and does not delete localStorage data.

## Manual Test Checklist

1. Load workbook samples.
2. Approve at least one product.
3. Confirm approved products appear in Launch Batch.
4. Change launch status.
5. Tick launch checklist items.
6. Refresh the browser and confirm launch status/checklist persisted.
7. Export website CSV and confirm Stock Quantity is not blank.
8. Confirm website CSV warns when website-ready products have missing or zero stock.
9. Create or duplicate a website-ready product with the same SKU, export website CSV, and confirm only one row appears for that SKU.
10. Confirm website CSV warns about skipped duplicate products/SKUs.
11. Confirm website CSV does not include source URL, supplier URL, unit cost, landed cost, purchase cost, profit, margin, internal notes, override reason, or QC notes.
12. Export approved/rejected CSV and confirm internal fields are preserved there.
13. Export BuyOS backup JSON.
14. Import the backup JSON and confirm products, settings, launch status, and checklist restore.
15. Try importing invalid JSON and confirm current data remains unchanged.
16. Try deleting a product and confirm the delete prompt appears.
17. With no `.env.local`, confirm the app shows local mode and existing local products still load.
18. With Supabase env configured but signed out, confirm the login panel appears and local mode remains usable.
19. Sign in with a Supabase Auth user that has a `buyos_members` row and confirm Cloud mode, signed-in email, and workspace name appear.
20. Sign in with a user that has no workspace membership and confirm the workspace error appears without crashing.
21. Migrate local data to cloud and confirm upload/skipped/failed counts appear and local data remains available.
22. Edit a product in Cloud mode, refresh, and confirm the edit persists.
23. Change launch status/checklist in Cloud mode, refresh, and confirm the values persist.
24. Export JSON backup in Cloud mode and confirm it includes cloud-loaded products/settings.
25. Try an invalid login and confirm a safe error appears without a crash.
26. Sign in to Cloud mode, delete all cloud products from Supabase, click Reload from cloud, and confirm the dashboard shows 0 products.
27. Confirm old localStorage demo products do not reappear automatically after a successful empty cloud reload.
28. Load workbook samples once, then load workbook samples again, and confirm duplicate samples are skipped with a clear message.
29. Click Clear local demo data, accept the confirmation, refresh, and confirm cloud data remains correct.
30. Confirm Supabase has one row for workspace `cd97992c-d51c-496c-8c27-9bd7bc322aaf`, click Reload from cloud, and confirm dashboard Total products is 1.
31. Confirm the storage panel shows Cloud rows loaded: 1 and Active products shown: 1.
32. Delete all cloud product rows, click Reload from cloud, and confirm dashboard Total products is 0 without old local demo products reappearing.
33. Confirm the storage panel shows Cloud rows loaded: 1, Cloud products mapped: 1, and Active products shown: 1 when Supabase has one product row.
34. Export JSON backup and confirm it contains the same number of products as Active products shown.
35. If `buyos_settings` is empty or missing optional columns, reload cloud and confirm products still remain visible.
36. Add three product URLs through Source Scout and confirm product count increases.
37. Confirm imported Source Scout products are Pending / Imported - Needs Review and keep source URLs.
38. Confirm draft scores appear without changing official scores until Apply draft scores is clicked.
39. Import the same URLs again and confirm duplicates are skipped.
40. Confirm imported products do not appear in website CSV until a human completes, approves, and marks them website-ready.
41. Create `.env.worker.local`, run `npm run scout:worker`, and confirm Source Scout rows get `metadataStatus`, `metadataFetchedAt`, `draftScoreSource`, and `missingFields`.
42. Reload BuyOS Cloud mode and confirm product cards show metadata status, listed source price when available, draft score source/confidence, missing fields, and Needs Review.
43. Reload Cloud mode and confirm pending Source Scout products use unique `SCOUT-*` SKUs instead of duplicate `AYN-*` SKUs.
44. Import two more Source Scout URLs and confirm each receives the next unique `SCOUT-*` SKU for its category.
45. Try Mark website ready on a `SCOUT-*` product and confirm BuyOS blocks it with the provisional SKU message.
46. Export website CSV and confirm provisional `SCOUT-*` products are skipped, final approved `AYN-*` products still export, Stock Quantity is not blank, and no supplier/source/cost/profit/margin/internal fields appear.
47. Query Supabase after reload and confirm Source Scout `data->>'sku'` and the `sku` column match unique `SCOUT-*` values.
48. Confirm Antique Gold Hoop Earrings remains `AYN-EAR-0001`.
49. Add Source Scout search tasks such as `gold hoop earrings` and `pearl hair clips`, then confirm the Search Intents list shows status, created date, last run, counts, and pause/resume/delete actions.
50. Configure `.env.discovery.local`, run `npm run scout:discover -- --dry-run`, and confirm candidate URLs print without inserting products.
51. Run `npm run scout:discover`, then confirm Supabase receives Pending / Needs Review discovered products with unique `SCOUT-*` SKUs and `source_discovery_worker` fields.
52. Run `npm run scout:worker` and confirm discovered products can be metadata-enriched.
53. Re-run discovery and confirm duplicates are skipped.
54. Export website CSV and confirm discovered SCOUT products do not export and no discovery/search/internal fields appear.

## Environment Variables

Copy `.env.example` to `.env.local` for local Supabase testing:

```bash
cp .env.example .env.local
```

Do not put real AI API keys, Supabase service-role keys, direct database connection strings, or database passwords in frontend code. Browser users can inspect frontend bundles, so OpenAI, Anthropic, Gemini, and similar keys must stay on a server.

## Next After MVP

- Add authentication and role-based approval permissions
- Add image uploads and product photo management
- Add backend-only AI scoring
- Add audit history for score changes, approvals, orders, arrivals, launch checklist changes, and QC
- Add supplier comparison and purchase planning reports
- Add website CMS integration for pushing approved product data
