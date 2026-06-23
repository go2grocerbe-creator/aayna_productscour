# AAYNA Product Scout Lite

A 6-tab Google Sheets / Excel workbook for tracking and scoring product sourcing
candidates from SkyBuyBD, AliExpress, or other China sourcing platforms against
AAYNA's specific brand criteria.

## Files

- `AAYNA_Product_Scout_Lite.xlsx` — the workbook. Open in Google Sheets
  (Drive → Upload → Open with Google Sheets, or File → Save as Google Sheets)
  or Excel/LibreOffice.
- `build_sheet.py` — the generator script (Python + openpyxl). Re-run it to
  regenerate the workbook from scratch after editing column definitions,
  formulas, or styling in code.

## Tabs

1. **Product Tracker** — 498 rows (rows 3-500) for candidate products. White
   columns are manual input; colored columns calculate automatically. Scores
   10 criteria (Feminine, Trend, AAYNA Aesthetic Fit, Easy to Style,
   Lightweight, Reels/Photo Potential, Giftability, Price Fit, Demand,
   Quality/Risk) into a Total Product Score out of 100, then applies hard
   rejection rules: price over BDT 700 forces "Price Review" (or "Reject" if
   it's far over), and a Quality/Risk or Aesthetic Fit score of 1-2 caps the
   decision at "Maybe" even if the total score is high. SKU auto-generates as
   AYN-<category code>-0001 using a fixed category→prefix lookup table on the
   Dropdown Lists tab (Earrings=EAR, Necklace=NEC, Ring=RNG, Bracelet=BRC,
   Hair Accessory=HAR, Gift Set=GFT, and a code for every other category), not
   from the category spelling. Also includes 24 practical sourcing and
   operations columns: supplier/product ratings, sold/review counts, MOQ and
   order quantities (with Total Purchase Cost calculating itself), shipping
   risk (weight/size, fragility, packaging difficulty, courier risk),
   competitor/market checks, an auto-calculated Auto Flag / Warning (the
   single biggest problem with a product, e.g. "Price too high", "Quality
   risk", "Too fragile", "Needs partner review", or "Good candidate"),
   Sourcing Status, and a 5-item website-readiness checklist that drives a
   self-calculating Ready for Website Upload? column. Plus 16 more columns
   added for: actual cost/profit tracking after an order ships (Actual
   Product Cost, Actual Shipping Cost, Actual Landed Cost, Actual Selling
   Price, Actual Profit, Actual Profit Margin — separate from the original
   estimates, since real China-sourcing costs can shift after shipping, fees,
   or exchange rate changes); a post-arrival quality check (Arrival Date,
   Quantity Received, Defect Count, QC Status, QC Notes, and a
   self-calculating Final Stock Accepted); and an AI scoring trace (AI Tool
   Used, AI Score Date, Scored By, Manual Score Adjusted?) for comparing how
   Claude/ChatGPT/Gemini first-opinion scores hold up. Includes 5
   demonstration rows, one for each decision branch.
2. **Dashboard** — read-only live overview, reading from Product Tracker rows
   3-500: totals by decision, total estimated purchase cost for approved
   products, products ready for website upload, high-risk products, products
   with high reel/photo potential, products approved but not ordered yet,
   products ordered but not arrived yet, a Monthly Budget section (Approved
   Purchase Cost, Remaining Budget, Budget Used %, Approved Quantity, Number
   of Approved Products — tracked against the Monthly Inventory Budget set on
   Settings), Top 10 highest scoring products, best products under BDT 700,
   best for reels/photos, best giftable products, and everything still
   awaiting partner review.
3. **Claude Scoring Prompt** — a ready-to-copy prompt for getting an AI first
   opinion on a product's 10 scores, recommended decision, and a content/reel
   idea, formatted to paste straight back into the Product Tracker.
4. **Settings** — exchange rates, default fees/markup, price ceilings,
   scoring weights, Buy/Maybe/Reject thresholds, and Monthly Inventory
   Budget. Change a number here once and every formula on the Product
   Tracker and Dashboard tabs updates.
5. **Dropdown Lists** — the option lists backing the dropdowns (platform,
   category, currency, decision, approval status, 1-5 scores, QC status, AI
   tool), plus the category→SKU-prefix lookup table.
6. **Instructions** — beginner-friendly, step-by-step usage guide for a
   3-partner team.

## Regenerating

```bash
pip install openpyxl
cd sheets && python3 build_sheet.py
```
