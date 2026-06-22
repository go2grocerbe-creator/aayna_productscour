# AAYNA Product Scout Lite

A 4-tab Google Sheets / Excel workbook for tracking and scoring product sourcing
candidates from SkyBuyBD, AliExpress, or other China sourcing platforms.

## Files

- `AAYNA_Product_Scout_Lite.xlsx` — the workbook. Open in Google Sheets
  (Drive → Upload → Open with Google Sheets, or File → Save as Google Sheets)
  or Excel/LibreOffice.
- `build_sheet.py` — the generator script (Python + openpyxl). Re-run it to
  regenerate the workbook from scratch after editing column definitions,
  formulas, or styling in code.

## Tabs

1. **Product Tracker** — one row per candidate product. White columns are
   manual input; colored columns calculate automatically.
2. **Settings** — exchange rates, default fees/markup, scoring weights, and
   Buy/Maybe/Reject thresholds. Change a number here once and every formula
   on the Product Tracker tab updates.
3. **Dropdown Lists** — the option lists backing the dropdowns (platform,
   category, currency, approval status, 1-5 scores).
4. **Instructions** — beginner-friendly, step-by-step usage guide for a
   3-partner team.

## Regenerating

```bash
pip install openpyxl
cd sheets && python3 build_sheet.py
```
