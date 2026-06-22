import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName

# ---------- AAYNA brand colors ----------
DUSTY_ROSE = "C98B95"
DUSTY_ROSE_LIGHT = "EFD9DC"
CREAM = "FBF7F2"
ANTIQUE_GOLD = "B89B5E"
ESPRESSO = "3B2F2A"
WHITE = "FFFFFF"
GREEN = "C6EFCE"
GREEN_FONT = "1E7B34"
YELLOW = "FFF3C4"
YELLOW_FONT = "9C7A00"
RED = "F8CFCB"
RED_FONT = "B23A32"

wb = Workbook()

# =====================================================================
# TAB 1: SETTINGS  (built first so other tabs can reference named ranges)
# =====================================================================
ws_set = wb.active
ws_set.title = "Settings"
ws_set.sheet_properties.tabColor = ANTIQUE_GOLD

header_fill = PatternFill("solid", fgColor=DUSTY_ROSE)
header_font = Font(bold=True, color=WHITE, size=12)
label_font = Font(bold=True, color=ESPRESSO)
note_font = Font(italic=True, color="6B5B53", size=9)

ws_set["A1"] = "AAYNA Product Scout Lite — Settings"
ws_set["A1"].font = Font(bold=True, size=14, color=ESPRESSO)
ws_set.merge_cells("A1:C1")
ws_set["A2"] = "Tune these numbers once. Every formula in the Product Tracker tab reads from here."
ws_set["A2"].font = note_font
ws_set.merge_cells("A2:D2")

settings_rows = [
    ("Setting", "Value", "Notes"),
    ("USD to BDT exchange rate", 122, "Update when BDT/USD rate changes"),
    ("RMB (CNY) to BDT exchange rate", 17, "Update when BDT/CNY rate changes"),
    ("Default customs/duty %", 0.07, "As decimal, e.g. 0.07 = 7%"),
    ("Default misc fee per unit (BDT)", 15, "Packaging, handling, platform fees per piece"),
    ("Default markup % over landed cost", 1.0, "1.0 = 100% markup (sell at 2x landed cost)"),
    ("Target max selling price (BDT)", 700, "AAYNA's 'mostly under' price ceiling"),
    ("Weight: Trend Score", 0.20, "Must add up to 1.00 across the 5 weights"),
    ("Weight: Brand Fit Score", 0.25, ""),
    ("Weight: Demand Score", 0.20, ""),
    ("Weight: Competition Score", 0.15, ""),
    ("Weight: Price Fit Score", 0.20, ""),
    ("Buy threshold (score >=)", 75, "Total Product Score is out of 100"),
    ("Maybe threshold (score >=)", 50, "Below this = Reject"),
]
for r, row in enumerate(settings_rows, start=4):
    for c, val in enumerate(row, start=1):
        cell = ws_set.cell(row=r, column=c, value=val)
        if r == 4:
            cell.fill = header_fill
            cell.font = header_font
        else:
            if c == 1:
                cell.font = label_font
            if c == 3:
                cell.font = note_font

ws_set.column_dimensions["A"].width = 34
ws_set.column_dimensions["B"].width = 12
ws_set.column_dimensions["C"].width = 46

# Named ranges for the settings values (column B of each row)
named_map = {
    "USD_BDT": 5,
    "RMB_BDT": 6,
    "CUSTOMS_PCT": 7,
    "MISC_FEE": 8,
    "MARKUP_PCT": 9,
    "MAX_PRICE": 10,
    "W_TREND": 11,
    "W_BRAND": 12,
    "W_DEMAND": 13,
    "W_COMPETITION": 14,
    "W_PRICEFIT": 15,
    "BUY_THRESHOLD": 16,
    "MAYBE_THRESHOLD": 17,
}
for name, row in named_map.items():
    ref = f"Settings!$B${row}"
    wb.defined_names[name] = DefinedName(name, attr_text=ref)

# =====================================================================
# TAB 2: DROPDOWNS  (lists used for data validation everywhere)
# =====================================================================
ws_lists = wb.create_sheet("Dropdown Lists")
ws_lists.sheet_properties.tabColor = ANTIQUE_GOLD

lists = {
    "A": ("Source Platform", ["SkyBuyBD", "AliExpress", "Yiwugo", "1688", "Local Wholesale", "Other"]),
    "B": ("Category", ["Earrings", "Necklace", "Bracelet", "Ring", "Hair Accessory", "Bag", "Belt",
                        "Sunglasses", "Watch", "Scarf", "Hijab Accessory", "Other"]),
    "C": ("Source Currency", ["BDT", "USD", "RMB"]),
    "D": ("Decision", ["Buy", "Maybe", "Reject"]),
    "E": ("Approval Status", ["Pending", "Approved", "Rejected", "On Hold"]),
    "F": ("Score (1-5)", [1, 2, 3, 4, 5]),
}
for col, (title, values) in lists.items():
    ws_lists[f"{col}1"] = title
    ws_lists[f"{col}1"].fill = header_fill
    ws_lists[f"{col}1"].font = header_font
    for i, v in enumerate(values, start=2):
        ws_lists[f"{col}{i}"] = v
    ws_lists.column_dimensions[col].width = 18

# Named ranges for each list (fixed length covers max list size)
wb.defined_names["LIST_PLATFORM"] = DefinedName("LIST_PLATFORM", attr_text="'Dropdown Lists'!$A$2:$A$7")
wb.defined_names["LIST_CATEGORY"] = DefinedName("LIST_CATEGORY", attr_text="'Dropdown Lists'!$B$2:$B$13")
wb.defined_names["LIST_CURRENCY"] = DefinedName("LIST_CURRENCY", attr_text="'Dropdown Lists'!$C$2:$C$4")
wb.defined_names["LIST_DECISION"] = DefinedName("LIST_DECISION", attr_text="'Dropdown Lists'!$D$2:$D$4")
wb.defined_names["LIST_APPROVAL"] = DefinedName("LIST_APPROVAL", attr_text="'Dropdown Lists'!$E$2:$E$5")
wb.defined_names["LIST_SCORE"] = DefinedName("LIST_SCORE", attr_text="'Dropdown Lists'!$F$2:$F$6")

# =====================================================================
# TAB 3: PRODUCT TRACKER (the main sheet)
# =====================================================================
ws = wb.create_sheet("Product Tracker", 0)
ws.sheet_properties.tabColor = DUSTY_ROSE

columns = [
    # (header, width, group_color)
    ("SKU", 12, DUSTY_ROSE),
    ("Date Added", 12, DUSTY_ROSE),
    ("Product Name", 26, DUSTY_ROSE),
    ("Product Image/Link", 22, DUSTY_ROSE),
    ("Category", 16, DUSTY_ROSE),
    ("Source Platform", 14, DUSTY_ROSE),
    ("Source URL", 22, DUSTY_ROSE),
    ("Supplier Name", 18, DUSTY_ROSE),

    ("Unit Cost (Source Currency)", 14, ANTIQUE_GOLD),
    ("Source Currency", 12, ANTIQUE_GOLD),
    ("Unit Cost (BDT)", 13, ANTIQUE_GOLD),
    ("Shipping Cost/Unit (BDT)", 14, ANTIQUE_GOLD),
    ("Customs/Duty %", 12, ANTIQUE_GOLD),
    ("Misc Fees/Unit (BDT)", 13, ANTIQUE_GOLD),
    ("Estimated Landed Cost (BDT)", 15, ANTIQUE_GOLD),

    ("Suggested Selling Price (BDT)", 16, "8FA98E"),
    ("Expected Profit/Unit (BDT)", 14, "8FA98E"),
    ("Profit Margin %", 12, "8FA98E"),

    ("Trend Score (1-5)", 11, ESPRESSO),
    ("Brand Fit Score (1-5)", 11, ESPRESSO),
    ("Demand Score (1-5)", 11, ESPRESSO),
    ("Competition Score (1-5)", 12, ESPRESSO),
    ("Price Fit Score (1-5)", 11, ESPRESSO),
    ("Total Product Score (/100)", 13, ESPRESSO),
    ("Decision", 11, ESPRESSO),
    ("Reason", 28, ESPRESSO),

    ("SKU/Content/Reel Idea", 30, "6B4F4F"),
    ("Approval Status", 13, "6B4F4F"),
    ("Approved By", 14, "6B4F4F"),
    ("Date Decided", 13, "6B4F4F"),
]

n_data_rows = 40
header_row = 2

ws["A1"] = "AAYNA Product Scout Lite — Product Tracker"
ws["A1"].font = Font(bold=True, size=14, color=ESPRESSO)
ws.merge_cells("A1:H1")
ws["I1"] = "Reflect your everyday style — sourcing decisions, made together."
ws["I1"].font = Font(italic=True, color="6B5B53", size=10)
ws.merge_cells("I1:T1")

for idx, (name, width, color) in enumerate(columns, start=1):
    col_letter = get_column_letter(idx)
    cell = ws.cell(row=header_row, column=idx, value=name)
    cell.fill = PatternFill("solid", fgColor=color)
    cell.font = Font(bold=True, color=WHITE, size=10)
    cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    ws.column_dimensions[col_letter].width = width

ws.row_dimensions[header_row].height = 38
ws.freeze_panes = "C3"

thin = Side(style="thin", color="D9CDC3")
border = Border(left=thin, right=thin, top=thin, bottom=thin)

first_data_row = header_row + 1
last_data_row = header_row + n_data_rows

for r in range(first_data_row, last_data_row + 1):
    # SKU (A): auto code based on category + row number
    ws[f"A{r}"] = f'=IF(C{r}="","","AYN-"&UPPER(LEFT(E{r},3))&"-"&TEXT(ROW()-{header_row},"000"))'
    # Unit Cost (BDT) (K)
    ws[f"K{r}"] = f'=IF(I{r}="","",IF(J{r}="BDT",I{r},IF(J{r}="USD",I{r}*USD_BDT,IF(J{r}="RMB",I{r}*RMB_BDT,""))))'
    # Estimated Landed Cost (O) = unit cost bdt + shipping + customs%*unit cost bdt + misc fees
    # (M and N fall back to Settings defaults via the IF()s below when left blank)
    ws[f"O{r}"] = f'=IF(K{r}="","",K{r}+IFERROR(L{r},0)+(K{r}*IF(M{r}="",CUSTOMS_PCT,M{r}))+IF(N{r}="",MISC_FEE,N{r}))'
    # Suggested Selling Price (P)
    ws[f"P{r}"] = f'=IF(O{r}="","",ROUND(O{r}*(1+MARKUP_PCT),-1)-1)'
    # Expected Profit/Unit (Q)
    ws[f"Q{r}"] = f'=IF(P{r}="","",P{r}-O{r})'
    # Profit Margin % (R)
    ws[f"R{r}"] = f'=IF(OR(P{r}="",P{r}=0),"",Q{r}/P{r})'
    # Total Product Score (X) weighted
    ws[f"X{r}"] = (f'=IF(COUNT(S{r}:W{r})<5,"",'
                   f'(S{r}*W_TREND+T{r}*W_BRAND+U{r}*W_DEMAND+V{r}*W_COMPETITION+W{r}*W_PRICEFIT)/5*100)')
    # Decision (Y)
    ws[f"Y{r}"] = f'=IF(X{r}="","",IF(X{r}>=BUY_THRESHOLD,"Buy",IF(X{r}>=MAYBE_THRESHOLD,"Maybe","Reject")))'

    for c in range(1, len(columns) + 1):
        ws.cell(row=r, column=c).border = border
        ws.cell(row=r, column=c).alignment = Alignment(vertical="center")

# Number formats
for r in range(first_data_row, last_data_row + 1):
    ws[f"B{r}"].number_format = "yyyy-mm-dd"
    for col in ["K", "L", "N", "O", "P", "Q"]:
        ws[f"{col}{r}"].number_format = '#,##0 "BDT"'
    ws[f"M{r}"].number_format = "0%"
    ws[f"R{r}"].number_format = "0%"
    ws[f"X{r}"].number_format = "0"
    ws[f"AD{r}"].number_format = "yyyy-mm-dd"

# Light banding fill for readability
band_fill = PatternFill("solid", fgColor=CREAM)
for r in range(first_data_row, last_data_row + 1):
    if (r - first_data_row) % 2 == 1:
        for c in range(1, len(columns) + 1):
            ws.cell(row=r, column=c).fill = band_fill

# ---------------- Data validation dropdowns ----------------
def add_dv(formula1, col_letter, tooltip=""):
    dv = DataValidation(type="list", formula1=formula1, allow_blank=True, showDropDown=False)
    dv.error = "Please choose a value from the list."
    dv.errorTitle = "Invalid entry"
    dv.prompt = tooltip
    dv.promptTitle = "Choose from list"
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}{first_data_row}:{col_letter}{last_data_row}")
    return dv

add_dv("LIST_PLATFORM", "F", "Where this product is sourced from")
add_dv("LIST_CATEGORY", "E", "Product category")
add_dv("LIST_CURRENCY", "J", "Currency the unit cost is quoted in")
add_dv("LIST_APPROVAL", "AB", "Partner approval status")
for col in ["S", "T", "U", "V", "W"]:
    add_dv("LIST_SCORE", col, "Score 1 (worst) to 5 (best)")

# ---------------- Conditional formatting on Decision (Y) ----------------
rng = f"Y{first_data_row}:Y{last_data_row}"
ws.conditional_formatting.add(
    rng, CellIsRule(operator="equal", formula=['"Buy"'],
                     fill=PatternFill("solid", fgColor=GREEN), font=Font(color=GREEN_FONT, bold=True)))
ws.conditional_formatting.add(
    rng, CellIsRule(operator="equal", formula=['"Maybe"'],
                     fill=PatternFill("solid", fgColor=YELLOW), font=Font(color=YELLOW_FONT, bold=True)))
ws.conditional_formatting.add(
    rng, CellIsRule(operator="equal", formula=['"Reject"'],
                     fill=PatternFill("solid", fgColor=RED), font=Font(color=RED_FONT, bold=True)))

# Highlight Suggested Selling Price in red text if it exceeds the MAX_PRICE ceiling
price_rng = f"P{first_data_row}:P{last_data_row}"
ws.conditional_formatting.add(
    price_rng,
    FormulaRule(formula=[f"P{first_data_row}>MAX_PRICE"], font=Font(color="B23A32", bold=True))
)

# Approval status colors
appr_rng = f"AB{first_data_row}:AB{last_data_row}"
ws.conditional_formatting.add(appr_rng, CellIsRule(operator="equal", formula=['"Approved"'],
                     fill=PatternFill("solid", fgColor=GREEN)))
ws.conditional_formatting.add(appr_rng, CellIsRule(operator="equal", formula=['"Rejected"'],
                     fill=PatternFill("solid", fgColor=RED)))
ws.conditional_formatting.add(appr_rng, CellIsRule(operator="equal", formula=['"Pending"'],
                     fill=PatternFill("solid", fgColor=YELLOW)))

# ---------------- Sample example rows (first 2 data rows) ----------------
sample1 = {
    "B": "2026-06-20", "C": "Antique Gold Hoop Earrings", "D": "drive.google.com/sample1",
    "E": "Earrings", "F": "AliExpress", "G": "aliexpress.com/item/sample1", "H": "Lin Wei Trading",
    "I": 1.8, "J": "USD", "L": 25, "N": 15,
    "S": 4, "T": 5, "U": 4, "V": 3, "W": 4,
    "AA": "Strong match for AAYNA's gold/feminine aesthetic; trending on TikTok.",
    "AC": "Reel: 'Get Ready With Me' earring swap, 3 looks in 15 sec.",
    "AB": "Approved", "AD": "2026-06-21",
}
sample2 = {
    "B": "2026-06-21", "C": "Dusty Rose Pearl Hair Clip Set", "D": "drive.google.com/sample2",
    "E": "Hair Accessory", "F": "SkyBuyBD", "G": "skybuybd.com/item/sample2", "H": "Skybuy Supplier 22",
    "I": 90, "J": "BDT", "L": 10, "M": 0.05, "N": 12,
    "S": 3, "T": 4, "U": 3, "V": 2, "W": 5,
    "AA": "Good margin but lots of similar clips already in market; watch competition.",
    "AC": "Carousel post: 5 hairstyles using one clip set.",
    "AB": "Pending", "AD": "",
}
for sample, row in zip([sample1, sample2], [first_data_row, first_data_row + 1]):
    for col, val in sample.items():
        ws[f"{col}{row}"] = val

# =====================================================================
# TAB 4: INSTRUCTIONS
# =====================================================================
ws_help = wb.create_sheet("Instructions")
ws_help.sheet_properties.tabColor = ESPRESSO
ws_help.column_dimensions["A"].width = 34
ws_help.column_dimensions["B"].width = 90

ws_help["A1"] = "AAYNA Product Scout Lite — How To Use"
ws_help["A1"].font = Font(bold=True, size=14, color=ESPRESSO)
ws_help.merge_cells("A1:B1")

intro = (
    "This sheet helps the 3 of us score and decide on products from SkyBuyBD, AliExpress, "
    "or other China sourcing platforms — fast, consistently, and without spreadsheets fights.\n\n"
    "Workflow: Whoever finds a product adds a new row and fills in the WHITE input columns only. "
    "The colored formula columns calculate themselves. Then each partner fills their Score columns, "
    "and the sheet tells you Buy / Maybe / Reject automatically."
)
ws_help["A2"] = "Overview"
ws_help["A2"].font = label_font
ws_help["B2"] = intro
ws_help["B2"].alignment = Alignment(wrap_text=True, vertical="top")
ws_help.row_dimensions[2].height = 90

rows_help = [
    ("Step 1 — Add the product", "Fill SKU is automatic. Enter Date Added, Product Name, Image/Link, Category, "
        "Source Platform, Source URL, Supplier Name."),
    ("Step 2 — Enter cost info", "Enter Unit Cost in whatever currency the supplier quoted (USD/RMB/BDT), pick the "
        "currency, then enter Shipping Cost/Unit and Misc Fees if known. Customs % and Misc Fees auto-fill from "
        "Settings tab if left blank."),
    ("Step 3 — Let it calculate", "Unit Cost (BDT), Estimated Landed Cost, Suggested Selling Price, Expected Profit, "
        "and Profit Margin % fill in automatically."),
    ("Step 4 — Score it (1 = worst, 5 = best)", "Trend Score: how hot is this right now (TikTok/IG/competitors)? "
        "Brand Fit Score: does it match AAYNA's dusty rose / cream / antique gold, feminine-trendy vibe? "
        "Demand Score: would our audience actually buy this? "
        "Competition Score: 5 = very few sellers have it, 1 = everyone already sells it. "
        "Price Fit Score: 5 = comfortably sits under our ~700 BDT price point, 1 = priced way above it."),
    ("Step 5 — Read the verdict", "Total Product Score (0-100) and Decision (Buy/Maybe/Reject) calculate "
        "automatically using the weights set in the Settings tab. Buy = green, Maybe = yellow, Reject = red."),
    ("Step 6 — Decide together", "Add a short Reason so the other partners know WHY. Add a Content/Reel Idea so "
        "marketing has a head start. Set Approval Status once all partners agree, note who Approved and the date."),
    ("Adjusting the formulas", "Don't like the default markup, exchange rate, or scoring weights? Change them ONCE "
        "in the Settings tab — every row updates automatically. No need to touch the Product Tracker formulas."),
    ("Color key", "Green = Buy / Approved. Yellow = Maybe / Pending. Red = Reject / Rejected, or a price above "
        "our 700 BDT ceiling."),
    ("Tips for 3-partner teams", "Assign one column block per partner if you want speed (e.g. Partner A scores "
        "Trend+Demand, Partner B scores Brand Fit+Price Fit, Partner C scores Competition) — or all 3 score "
        "independently and average manually before finalizing. Keep the Reason column honest; it's your shared memory."),
]
r = 4
for title, body in rows_help:
    ws_help[f"A{r}"] = title
    ws_help[f"A{r}"].font = label_font
    ws_help[f"A{r}"].alignment = Alignment(wrap_text=True, vertical="top")
    ws_help[f"B{r}"] = body
    ws_help[f"B{r}"].alignment = Alignment(wrap_text=True, vertical="top")
    ws_help.row_dimensions[r].height = 60
    r += 1

wb._sheets = [ws, ws_set, ws_lists, ws_help]

out_path = "AAYNA_Product_Scout_Lite.xlsx"
wb.save(out_path)
print("Saved:", out_path)
