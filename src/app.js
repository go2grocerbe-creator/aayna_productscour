import * as buyosStorage from "./storage.js";

const TODAY = new Date().toISOString().slice(0, 10);
const APP_SCHEMA_VERSION = 3;
const PRODUCTS_STORAGE_KEY = "aaynaProducts";
const SETTINGS_STORAGE_KEY = "aaynaSettings";
const BACKUP_APP_MARKER = "AAYNABuyOS";

const DEFAULT_SETTINGS = {
  usdRate: 122,
  rmbRate: 17,
  defaultCustomsPct: 7,
  defaultMiscFee: 15,
  markupPercentage: 100,
  targetMaxPrice: 700,
  hardRejectPrice: 1000,
  monthlyBudget: 30000,
  lowProfitThreshold: 30,
  moqWarningThreshold: 50,
  sourceScoutTasks: []
};

const BUY_THRESHOLD = 80;
const MAYBE_THRESHOLD = 65;

const SCORE_FIELDS = [
  ["feminine", "Feminine", 0.1],
  ["trendy", "Trendy", 0.1],
  ["aaynaFit", "AAYNA aesthetic fit", 0.15],
  ["easyToStyle", "Easy to style", 0.08],
  ["lightweight", "Lightweight", 0.07],
  ["reelsPhotos", "Good for reels/photos", 0.1],
  ["giftability", "Giftability", 0.08],
  ["priceFit", "Price fit", 0.12],
  ["demand", "Demand", 0.12],
  ["qualityRisk", "Quality/risk", 0.08]
];

const DROPDOWNS = {
  sourcePlatform: ["SkyBuyBD", "AliExpress", "Yiwugo", "1688", "Local Wholesale", "Other"],
  category: ["Earrings", "Necklace", "Bracelet", "Ring", "Hair Accessory", "Bag", "Belt", "Sunglasses", "Watch", "Scarf", "Hijab Accessory", "Gift Set", "Other"],
  sourceCurrency: ["BDT", "USD", "RMB"],
  decision: ["Buy", "Maybe", "Price Review", "Reject"],
  approvalStatus: ["Pending", "Approved", "Rejected", "On Hold"],
  yesNo: ["No", "Yes"],
  riskLevel: ["Low", "Medium", "High"],
  packagingDifficulty: ["Easy", "Medium", "Hard"],
  sourcingStatus: ["Not Started", "Sourcing", "Sample Ordered", "Sample Received", "Approved - Not Ordered", "Ordered", "In Transit", "Arrived", "Live on Website"],
  qcStatus: ["Not Arrived", "QC Pending", "QC Passed", "Minor Defect", "QC Failed", "Discount Sell", "Return/Reject"],
  aiTool: ["", "Claude", "ChatGPT", "Gemini", "Other"]
};

const LAUNCH_STATUSES = [
  ["shortlisted", "Shortlisted"],
  ["sample_order", "Sample order"],
  ["ordered", "Ordered"],
  ["received", "Received"],
  ["photo_ready", "Photo ready"],
  ["website_ready", "Website ready"],
  ["live", "Live"],
  ["paused", "Paused"]
];

const LAUNCH_CHECKLIST = [
  ["productNameReady", "Product name"],
  ["descriptionReady", "Description"],
  ["priceConfirmed", "Price confirmed"],
  ["imagesReady", "Images"],
  ["stockConfirmed", "Stock confirmed"],
  ["websiteExportReady", "Website export"],
  ["instagramContentPlanned", "Instagram content"]
];

const DEFAULT_LAUNCH_CHECKLIST = Object.fromEntries(LAUNCH_CHECKLIST.map(([key]) => [key, false]));

const CATEGORY_PREFIX = {
  Earrings: "EAR",
  Necklace: "NEC",
  Bracelet: "BRC",
  Ring: "RNG",
  "Hair Accessory": "HAR",
  Bag: "BAG",
  Belt: "BLT",
  Sunglasses: "SUN",
  Watch: "WCH",
  Scarf: "SCF",
  "Hijab Accessory": "HIJ",
  "Gift Set": "GFT",
  Other: "OTH"
};

const FIELD_DEFAULTS = {
  dateAdded: TODAY,
  sourcePlatform: "AliExpress",
  category: "Earrings",
  sourceCurrency: "BDT",
  shippingCostBdt: 0,
  moq: 1,
  recommendedTestQuantity: 1,
  finalApprovedQuantity: 1,
  realReviewPhotos: "No",
  fragilityLevel: "Low",
  packagingDifficulty: "Easy",
  courierRisk: "Low",
  duplicateFound: "No",
  marketSaturationLevel: "Low",
  approvalStatus: "Pending",
  sourcingStatus: "Not Started",
  productNameFinalized: "No",
  skuFinalized: "No",
  photosReady: "No",
  descriptionReady: "No",
  priceApproved: "No",
  qcStatus: "Not Arrived",
  manualScoreAdjusted: "No",
  draftScores: null,
  draftScoreReason: "",
  draftScoreConfidence: "",
  draftScoreSource: "",
  draftMissingFields: [],
  metadataStatus: "",
  metadataFetchedAt: "",
  metadataSource: "",
  metadataError: "",
  scoutMetadata: null,
  listedSourcePrice: "",
  listedSourceCurrency: "",
  listedPriceFetchedAt: "",
  missingFields: [],
  provisionalSku: false,
  discoveredBy: "",
  discoveredAt: "",
  sourceScoutTaskId: "",
  sourceScoutKeyword: "",
  sourceDiscoveryProvider: "",
  sourceDiscoveryRank: "",
  importStatus: "",
  needsHumanReview: false,
  importedBy: "",
  importedAt: "",
  needsScoreReview: false,
  launchStatus: "",
  launchChecklist: { ...DEFAULT_LAUNCH_CHECKLIST }
};

const FORM_FIELDS = [
  "sku", "dateAdded", "productName", "productImageLink", "category", "sourcePlatform", "sourceUrl",
  "supplierName", "unitCost", "sourceCurrency", "shippingCostBdt", "customsDutyPct", "miscFeesBdt",
  "reason", "contentIdea", "approvalStatus", "approvedBy", "dateDecided", "approvalOverrideReason", "supplierRating",
  "productRating", "soldCount", "reviewCount", "realReviewPhotos", "moq", "recommendedTestQuantity",
  "finalApprovedQuantity", "weightSize", "fragilityLevel", "packagingDifficulty", "courierRisk",
  "duplicateFound", "competitorPrice", "marketSaturationLevel", "sourcingStatus", "productNameFinalized",
  "skuFinalized", "photosReady", "descriptionReady", "priceApproved", "actualProductCost",
  "actualShippingCost", "actualSellingPrice", "arrivalDate", "quantityReceived", "defectCount",
  "qcStatus", "qcNotes", "aiToolUsed", "aiScoreDate", "scoredBy", "manualScoreAdjusted"
];

const SAMPLE_PRODUCTS = [
  {
    sku: "",
    dateAdded: "2026-06-20",
    productName: "Antique Gold Hoop Earrings",
    productImageLink: "",
    category: "Earrings",
    sourcePlatform: "AliExpress",
    sourceUrl: "https://www.aliexpress.com/item/sample1",
    supplierName: "Lin Wei Trading",
    unitCost: 1.8,
    sourceCurrency: "USD",
    shippingCostBdt: 25,
    miscFeesBdt: 15,
    supplierRating: 4.8,
    productRating: 4.7,
    soldCount: 1800,
    reviewCount: 420,
    realReviewPhotos: "Yes",
    moq: 12,
    recommendedTestQuantity: 12,
    finalApprovedQuantity: 12,
    weightSize: "18g",
    fragilityLevel: "Low",
    packagingDifficulty: "Easy",
    courierRisk: "Low",
    duplicateFound: "No",
    competitorPrice: 650,
    marketSaturationLevel: "Medium",
    contentIdea: "Try-on reel with casual and Eid looks.",
    reason: "Strong feminine styling, good price fit, and easy content angle.",
    approvalStatus: "Approved",
    sourcingStatus: "Approved - Not Ordered",
    productNameFinalized: "Yes",
    skuFinalized: "Yes",
    photosReady: "Yes",
    descriptionReady: "Yes",
    priceApproved: "Yes",
    scores: {
      feminine: 5,
      trendy: 5,
      aaynaFit: 5,
      easyToStyle: 5,
      lightweight: 5,
      reelsPhotos: 5,
      giftability: 4,
      priceFit: 4,
      demand: 4,
      qualityRisk: 4
    }
  },
  {
    sku: "",
    dateAdded: "2026-06-21",
    productName: "Beaded Choker Necklace",
    productImageLink: "",
    category: "Necklace",
    sourcePlatform: "SkyBuyBD",
    sourceUrl: "https://skybuybd.com/item/sample2",
    supplierName: "Skybuy Supplier 14",
    unitCost: 60,
    sourceCurrency: "BDT",
    shippingCostBdt: 10,
    miscFeesBdt: 12,
    supplierRating: 4.4,
    productRating: 4.5,
    soldCount: 600,
    reviewCount: 110,
    realReviewPhotos: "Yes",
    moq: 20,
    recommendedTestQuantity: 20,
    finalApprovedQuantity: 20,
    weightSize: "22g",
    fragilityLevel: "Medium",
    packagingDifficulty: "Medium",
    courierRisk: "Medium",
    duplicateFound: "No",
    competitorPrice: 450,
    marketSaturationLevel: "Low",
    contentIdea: "Layered necklace styling photos.",
    reason: "Good budget product with strong giftability.",
    approvalStatus: "Pending",
    sourcingStatus: "Sourcing",
    scores: {
      feminine: 4,
      trendy: 3,
      aaynaFit: 4,
      easyToStyle: 4,
      lightweight: 4,
      reelsPhotos: 3,
      giftability: 4,
      priceFit: 4,
      demand: 3,
      qualityRisk: 4
    }
  },
  {
    sku: "",
    dateAdded: "2026-06-22",
    productName: "Designer-Inspired Sunglasses",
    productImageLink: "",
    category: "Sunglasses",
    sourcePlatform: "AliExpress",
    sourceUrl: "https://www.aliexpress.com/item/sample5",
    supplierName: "Guangzhou Eyewear Co",
    unitCost: 3.3,
    sourceCurrency: "USD",
    shippingCostBdt: 50,
    miscFeesBdt: 15,
    supplierRating: 4.2,
    productRating: 4.1,
    soldCount: 200,
    reviewCount: 35,
    realReviewPhotos: "No",
    moq: 5,
    recommendedTestQuantity: 5,
    finalApprovedQuantity: 5,
    weightSize: "42g",
    fragilityLevel: "High",
    packagingDifficulty: "Hard",
    courierRisk: "High",
    duplicateFound: "Yes",
    competitorPrice: 950,
    marketSaturationLevel: "High",
    reason: "Likely price review because landed cost pushes retail above BDT 700.",
    approvalStatus: "On Hold",
    sourcingStatus: "Not Started",
    scores: {
      feminine: 3,
      trendy: 4,
      aaynaFit: 3,
      easyToStyle: 4,
      lightweight: 2,
      reelsPhotos: 4,
      giftability: 3,
      priceFit: 1,
      demand: 3,
      qualityRisk: 2
    }
  },
  {
    sku: "",
    dateAdded: "2026-06-22",
    productName: "Premium Embroidered Tote Bag",
    productImageLink: "",
    category: "Bag",
    sourcePlatform: "AliExpress",
    sourceUrl: "https://www.aliexpress.com/item/sample-reject-price",
    supplierName: "Premium Bags Co",
    unitCost: 650,
    sourceCurrency: "BDT",
    shippingCostBdt: 90,
    miscFeesBdt: 25,
    supplierRating: 4.6,
    productRating: 4.4,
    soldCount: 320,
    reviewCount: 72,
    realReviewPhotos: "Yes",
    moq: 8,
    recommendedTestQuantity: 8,
    finalApprovedQuantity: 8,
    weightSize: "280g",
    fragilityLevel: "Low",
    packagingDifficulty: "Medium",
    courierRisk: "Medium",
    duplicateFound: "No",
    competitorPrice: 1400,
    marketSaturationLevel: "Medium",
    reason: "Reject by price because suggested selling price exceeds hard limit.",
    approvalStatus: "Rejected",
    sourcingStatus: "Not Started",
    scores: {
      feminine: 5,
      trendy: 4,
      aaynaFit: 5,
      easyToStyle: 4,
      lightweight: 3,
      reelsPhotos: 5,
      giftability: 4,
      priceFit: 1,
      demand: 4,
      qualityRisk: 4
    }
  },
  {
    sku: "",
    dateAdded: "2026-06-23",
    productName: "Plastic Clip Mixed Pack",
    productImageLink: "",
    category: "Hair Accessory",
    sourcePlatform: "1688",
    sourceUrl: "https://www.1688.com/item/sample-reject-quality",
    supplierName: "Generic Factory 8",
    unitCost: 22,
    sourceCurrency: "BDT",
    shippingCostBdt: 8,
    miscFeesBdt: 10,
    supplierRating: 3.6,
    productRating: 3.2,
    soldCount: 80,
    reviewCount: 10,
    realReviewPhotos: "No",
    moq: 100,
    recommendedTestQuantity: 0,
    finalApprovedQuantity: 0,
    weightSize: "10g",
    fragilityLevel: "Low",
    packagingDifficulty: "Easy",
    courierRisk: "Low",
    duplicateFound: "Yes",
    competitorPrice: 180,
    marketSaturationLevel: "High",
    reason: "Reject by quality/aesthetic guardrail and weak score.",
    approvalStatus: "Rejected",
    sourcingStatus: "Not Started",
    scores: {
      feminine: 2,
      trendy: 2,
      aaynaFit: 1,
      easyToStyle: 3,
      lightweight: 5,
      reelsPhotos: 2,
      giftability: 2,
      priceFit: 4,
      demand: 2,
      qualityRisk: 1
    }
  }
];

let products = [];
let settings = { ...DEFAULT_SETTINGS };
let storageState = {
  mode: "local",
  user: null,
  workspace: null,
  status: "Local mode",
  error: ""
};

const form = document.querySelector("#productForm");
const sourceScoutForm = document.querySelector("#sourceScoutForm");
const settingsForm = document.querySelector("#settingsForm");
const scoreInputs = document.querySelector("#scoreInputs");
const calculatorPreview = document.querySelector("#calculatorPreview");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");
const formMessage = document.querySelector("#formMessage");
const storageStatusText = document.querySelector("#storageStatusText");
const storageDebugText = document.querySelector("#storageDebugText");
const loginForm = document.querySelector("#loginForm");
const signOutBtn = document.querySelector("#signOutBtn");
const migrateCloudBtn = document.querySelector("#migrateCloudBtn");
const reloadCloudBtn = document.querySelector("#reloadCloudBtn");
const clearLocalDataBtn = document.querySelector("#clearLocalDataBtn");
const scoutTasksList = document.querySelector("#scoutTasksList");

async function loadActiveStorageState() {
  storageState = await buyosStorage.initializeStorage();
  const loadedProducts = Array.isArray(storageState.products) ? storageState.products : [];
  products = loadedProducts.map(normalizeProduct);
  const repairResult = repairSourceScoutSkus(products);
  products = repairResult.products;
  if (repairResult.changed) {
    await persistSourceScoutSkuRepairs(repairResult.repairedProducts);
  }
  settings = {
    ...DEFAULT_SETTINGS,
    ...(storageState.settings || {})
  };
  renderStorageStatus();
}

async function saveProducts(nextProducts = products) {
  try {
    await buyosStorage.saveBuyosState({ products: nextProducts.map(normalizeProduct) });
  } catch (error) {
    showMessage("error", `Cloud save failed: ${error.message || "Could not save products"}`);
    throw error;
  }
}

async function saveProductToStorage(product) {
  try {
    const saved = await buyosStorage.saveProduct(normalizeProduct(product));
    return normalizeProduct(saved);
  } catch (error) {
    showMessage("error", `Cloud save failed: ${error.message || "Could not save product"}`);
    throw error;
  }
}

async function persistSourceScoutSkuRepairs(repairedProducts) {
  if (!Array.isArray(repairedProducts) || !repairedProducts.length) return;
  const savedProducts = [];
  for (const product of repairedProducts) {
    savedProducts.push(await saveProductToStorage(product));
  }
  products = products.map((product) => {
    const saved = savedProducts.find((item) =>
      matchesProductIdentity(product, item.id)
      || matchesProductIdentity(product, item.dbId)
      || matchesProductIdentity(product, item.legacyId)
    );
    return saved || product;
  });
  console.info(`Repaired ${savedProducts.length} Source Scout provisional SKUs.`);
  showMessage("success", `Repaired ${savedProducts.length} Source Scout provisional SKUs.`);
}

async function saveSettings() {
  try {
    await buyosStorage.saveSettings(settings);
  } catch (error) {
    showMessage("error", `Cloud save failed: ${error.message || "Could not save settings"}`);
    throw error;
  }
}

function normalizeProduct(product) {
  const normalized = { ...FIELD_DEFAULTS, ...product };
  normalized.productName = product.productName || "";
  normalized.productImageLink = product.productImageLink || product.imageUrl || "";
  normalized.unitCost = product.unitCost ?? product.supplierPrice ?? "";
  normalized.sourceCurrency = product.sourceCurrency || product.currency || "BDT";
  normalized.shippingCostBdt = product.shippingCostBdt ?? product.shippingCost ?? 0;
  normalized.approvalStatus = product.approvalStatus || statusToApproval(product.status);
  normalized.sourcingStatus = product.sourcingStatus || "Not Started";
  normalized.launchStatus = normalized.approvalStatus === "Approved" ? (product.launchStatus || "shortlisted") : "";
  normalized.launchChecklist = {
    ...DEFAULT_LAUNCH_CHECKLIST,
    ...(product.launchChecklist || {})
  };
  normalized.draftScores = product.draftScores && typeof product.draftScores === "object"
    ? { ...product.draftScores }
    : null;
  normalized.draftMissingFields = Array.isArray(product.draftMissingFields) ? product.draftMissingFields : [];
  normalized.missingFields = Array.isArray(product.missingFields) ? product.missingFields : [];
  normalized.scoutMetadata = product.scoutMetadata && typeof product.scoutMetadata === "object"
    ? { ...product.scoutMetadata }
    : null;
  normalized.needsHumanReview = Boolean(product.needsHumanReview);
  normalized.needsScoreReview = Boolean(product.needsScoreReview);
  normalized.provisionalSku = Boolean(product.provisionalSku) || isScoutSku(normalized.sku);
  normalized.scores = {};
  SCORE_FIELDS.forEach(([key]) => {
    const existing = product.scores?.[key];
    normalized.scores[key] = existing === undefined ? 3 : clampScore(existing);
  });
  return normalized;
}

function statusToApproval(status) {
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  if (status === "Watchlist") return "On Hold";
  return "Pending";
}

function populateSelect(id, values, includeBlank = false) {
  const select = document.querySelector(`#${id}`);
  select.innerHTML = `${includeBlank ? '<option value=""></option>' : ""}${values.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
}

function initializeDropdowns() {
  populateSelect("category", DROPDOWNS.category);
  populateSelect("sourcePlatform", DROPDOWNS.sourcePlatform);
  populateSelect("scoutTargetCategory", DROPDOWNS.category);
  populateSelect("scoutSourcePlatform", DROPDOWNS.sourcePlatform);
  populateSelect("sourceCurrency", DROPDOWNS.sourceCurrency);
  populateSelect("realReviewPhotos", DROPDOWNS.yesNo);
  populateSelect("fragilityLevel", DROPDOWNS.riskLevel);
  populateSelect("packagingDifficulty", DROPDOWNS.packagingDifficulty);
  populateSelect("courierRisk", DROPDOWNS.riskLevel);
  populateSelect("duplicateFound", DROPDOWNS.yesNo);
  populateSelect("marketSaturationLevel", DROPDOWNS.riskLevel);
  populateSelect("approvalStatus", DROPDOWNS.approvalStatus);
  populateSelect("sourcingStatus", DROPDOWNS.sourcingStatus);
  populateSelect("productNameFinalized", DROPDOWNS.yesNo);
  populateSelect("skuFinalized", DROPDOWNS.yesNo);
  populateSelect("photosReady", DROPDOWNS.yesNo);
  populateSelect("descriptionReady", DROPDOWNS.yesNo);
  populateSelect("priceApproved", DROPDOWNS.yesNo);
  populateSelect("qcStatus", DROPDOWNS.qcStatus);
  populateSelect("aiToolUsed", DROPDOWNS.aiTool, true);
  populateSelect("manualScoreAdjusted", DROPDOWNS.yesNo);
  populateSelect("decisionFilter", DROPDOWNS.decision, true);
}

function renderScoreInputs() {
  scoreInputs.innerHTML = SCORE_FIELDS.map(([key, label]) => `
    <label>
      ${label}
      <input id="score-${key}" type="number" min="1" max="5" step="1" value="3" />
    </label>
  `).join("");
}

function currencyRate(currency) {
  if (currency === "USD") return settings.usdRate;
  if (currency === "RMB") return settings.rmbRate;
  return 1;
}

function numberValue(id, fallback = 0) {
  const value = document.querySelector(`#${id}`).value;
  return value === "" ? fallback : Number(value);
}

function optionalNumberValue(id) {
  const value = document.querySelector(`#${id}`).value;
  return value === "" ? "" : Number(value);
}

function toNumber(value, fallback = 0) {
  return value === "" || value === null || value === undefined ? fallback : Number(value);
}

function hasValue(value) {
  return value !== "" && value !== null && value !== undefined;
}

function clampScore(value) {
  return Math.max(1, Math.min(5, Number(value || 3)));
}

function money(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "৳0";
  const sign = numeric < 0 ? "-" : "";
  return `${sign}৳${Math.round(Math.abs(numeric)).toLocaleString("en-US")}`;
}

function percent(value) {
  if (value === "" || value === null || value === undefined || !Number.isFinite(Number(value))) return "-";
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function moneyOrDash(value) {
  return value === "" || value === null || value === undefined ? "-" : money(value);
}

function positiveWholeNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.floor(number);
}

function getPublicStockQuantity(product) {
  const costs = product.costs || calculateCosts(product);
  const candidates = [
    costs.finalStockAccepted,
    product.finalAcceptedStock,
    product.acceptedStock,
    product.receivedQuantity,
    product.quantityReceived,
    product.orderQuantity,
    product.finalApprovedQuantity,
    product.stockQuantity
  ];
  for (const candidate of candidates) {
    const stock = positiveWholeNumber(candidate);
    if (stock > 0) return stock;
  }
  return 0;
}

function hasMissingPublicStock(product) {
  return getPublicStockQuantity(product) <= 0;
}

function roundToWorkbookPrice(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / 10) * 10 - 1;
}

function generateSku(product, index = products.length) {
  if (product.sku) return product.sku;
  if (product.importedBy === "source_scout") return "SKU repair needed";
  if (!product.productName) return "";
  const prefix = CATEGORY_PREFIX[product.category] || "OTH";
  return `AYN-${prefix}-${String(index + 1).padStart(4, "0")}`;
}

function generateScoutSku(category, existingProducts = products, currentId = "") {
  const prefix = CATEGORY_PREFIX[category] || "OTH";
  const pattern = new RegExp(`^SCOUT-${prefix}-(\\d{4})$`, "i");
  const used = new Set();
  existingProducts.forEach((product) => {
    if (currentId && matchesProductIdentity(product, currentId)) return;
    extractProductSkuValues(product).forEach((sku) => {
      const match = sku.match(pattern);
      if (match) used.add(Number(match[1]));
    });
  });
  let next = 1;
  while (used.has(next)) next += 1;
  return `SCOUT-${prefix}-${String(next).padStart(4, "0")}`;
}

function isScoutSku(sku) {
  return String(sku || "").toUpperCase().startsWith("SCOUT-");
}

function hasProvisionalScoutSku(product) {
  return Boolean(product.provisionalSku)
    || isScoutSku(product.sku)
    || (product.importedBy === "source_scout" && product.skuFinalized !== "Yes");
}

function isProtectedFromScoutRepair(product) {
  return product.approvalStatus === "Approved"
    || product.launchStatus === "website_ready"
    || product.launchStatus === "live";
}

function isPendingSourceScoutProduct(product) {
  return product.importedBy === "source_scout"
    && !isProtectedFromScoutRepair(product);
}

function extractProductSkuValues(product) {
  return [
    product?.sku,
    product?.enteredSku,
    product?.data?.sku
  ]
    .map((sku) => String(sku || "").trim())
    .filter(Boolean);
}

function normalizedSkuKey(sku) {
  return String(sku || "").trim().toUpperCase();
}

function matchesProductIdentity(product, identity) {
  return Boolean(identity) && [product?.id, product?.dbId, product?.legacyId].some((value) => value === identity);
}

function nextScoutSkuFromUsed(category, usedSkuKeys) {
  const prefix = CATEGORY_PREFIX[category] || "OTH";
  const pattern = new RegExp(`^SCOUT-${prefix}-(\\d{4})$`, "i");
  const usedNumbers = new Set();
  usedSkuKeys.forEach((sku) => {
    const match = String(sku || "").match(pattern);
    if (match) usedNumbers.add(Number(match[1]));
  });
  let next = 1;
  while (usedNumbers.has(next)) next += 1;
  return `SCOUT-${prefix}-${String(next).padStart(4, "0")}`;
}

function sourceScoutRepairCompare(a, b) {
  const dateFields = ["createdAt", "created_at", "importedAt"];
  for (const field of dateFields) {
    const aTime = timestampValue(a[field]);
    const bTime = timestampValue(b[field]);
    if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
    if (aTime !== null && bTime === null) return -1;
    if (aTime === null && bTime !== null) return 1;
  }

  const nameCompare = normalizeKey(a.productName).localeCompare(normalizeKey(b.productName));
  if (nameCompare) return nameCompare;
  return normalizeKey(a.id || a.dbId || a.legacyId).localeCompare(normalizeKey(b.id || b.dbId || b.legacyId));
}

function timestampValue(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function repairSourceScoutSkus(sourceProducts) {
  const repairedProducts = [];
  const usedSkuKeys = new Set();
  let changed = false;
  const markRepaired = (product) => {
    const exists = repairedProducts.some((item) =>
      matchesProductIdentity(item, product.id)
      || matchesProductIdentity(item, product.dbId)
      || matchesProductIdentity(item, product.legacyId)
    );
    if (!exists) repairedProducts.push(product);
  };

  const products = sourceProducts.map((product) => ({ ...product }));
  sourceProducts.forEach((product) => {
    if (isPendingSourceScoutProduct(product)) return;
    extractProductSkuValues(product).forEach((sku) => usedSkuKeys.add(normalizedSkuKey(sku)));
  });

  products
    .filter(isPendingSourceScoutProduct)
    .sort(sourceScoutRepairCompare)
    .forEach((next) => {
      const skuKey = normalizedSkuKey(next.sku);
      const needsRepair = !skuKey
        || skuKey.startsWith("AYN-")
        || !isScoutSku(next.sku)
        || usedSkuKeys.has(skuKey);

      if (needsRepair) {
        next.sku = nextScoutSkuFromUsed(next.category, usedSkuKeys);
        next.provisionalSku = true;
        next.skuFinalized = "No";
        usedSkuKeys.add(normalizedSkuKey(next.sku));
        changed = true;
        markRepaired(next);
        return;
      }

      usedSkuKeys.add(skuKey);
      if (hasProvisionalScoutSku(next)) {
        if (!next.provisionalSku) {
          next.provisionalSku = true;
          changed = true;
          markRepaired(next);
        }
        if (next.skuFinalized === "Yes") {
          next.skuFinalized = "No";
          changed = true;
          markRepaired(next);
        }
      }
    });

  return { products, changed, repairedProducts };
}

function calculateCosts(product) {
  const hasCostData = product.unitCost !== "" && product.unitCost !== null && product.unitCost !== undefined;
  if (!hasCostData) {
    return {
      hasCostData: false,
      unitCostBdt: "",
      customsRate: settings.defaultCustomsPct / 100,
      miscFee: settings.defaultMiscFee,
      estimatedLandedCost: "",
      suggestedSellingPrice: "",
      expectedProfit: "",
      profitMargin: "",
      totalPurchaseCost: "",
      actualLandedCost: "",
      actualProfit: "",
      actualProfitMargin: "",
      finalStockAccepted: hasValue(product.quantityReceived) && hasValue(product.defectCount)
        ? Math.max(0, toNumber(product.quantityReceived) - toNumber(product.defectCount))
        : ""
    };
  }
  const unitCostBdt = toNumber(product.unitCost) * currencyRate(product.sourceCurrency);
  const customsRate = product.customsDutyPct === "" || product.customsDutyPct === undefined
    ? settings.defaultCustomsPct / 100
    : toNumber(product.customsDutyPct) / 100;
  const miscFee = product.miscFeesBdt === "" || product.miscFeesBdt === undefined
    ? settings.defaultMiscFee
    : toNumber(product.miscFeesBdt);
  const shipping = toNumber(product.shippingCostBdt);
  const estimatedLandedCost = unitCostBdt + shipping + (unitCostBdt * customsRate) + miscFee;
  const suggestedSellingPrice = roundToWorkbookPrice(estimatedLandedCost * (1 + settings.markupPercentage / 100));
  const expectedProfit = suggestedSellingPrice - estimatedLandedCost;
  const profitMargin = suggestedSellingPrice > 0 ? expectedProfit / suggestedSellingPrice : 0;
  const finalApprovedQuantity = Math.max(0, toNumber(product.finalApprovedQuantity));
  const totalPurchaseCost = estimatedLandedCost * finalApprovedQuantity;
  const actualLandedCost = hasValue(product.actualProductCost) && hasValue(product.actualShippingCost)
    ? toNumber(product.actualProductCost) + toNumber(product.actualShippingCost)
    : "";
  const actualProfit = hasValue(product.actualSellingPrice) && actualLandedCost !== ""
    ? toNumber(product.actualSellingPrice) - actualLandedCost
    : "";
  const actualProfitMargin = hasValue(product.actualSellingPrice) && toNumber(product.actualSellingPrice) > 0 && actualProfit !== ""
    ? actualProfit / toNumber(product.actualSellingPrice)
    : "";
  const finalStockAccepted = hasValue(product.quantityReceived) && hasValue(product.defectCount)
    ? Math.max(0, toNumber(product.quantityReceived) - toNumber(product.defectCount))
    : "";

  return {
    hasCostData: true,
    unitCostBdt,
    customsRate,
    miscFee,
    estimatedLandedCost,
    suggestedSellingPrice,
    expectedProfit,
    profitMargin,
    totalPurchaseCost,
    actualLandedCost,
    actualProfit,
    actualProfitMargin,
    finalStockAccepted
  };
}

function calculateScore(product) {
  const hasAllScores = SCORE_FIELDS.every(([key]) => product.scores?.[key]);
  if (!hasAllScores) return 0;
  const weighted = SCORE_FIELDS.reduce((sum, [key, , weight]) => sum + clampScore(product.scores[key]) * weight, 0);
  return Math.round((weighted / 5) * 100);
}

function calculateDecision(product) {
  const score = calculateScore(product);
  const costs = calculateCosts(product);
  const aesthetic = clampScore(product.scores?.aaynaFit);
  const qualityRisk = clampScore(product.scores?.qualityRisk);

  if (!costs.hasCostData) return "Reject";
  if (costs.suggestedSellingPrice > settings.hardRejectPrice) return "Reject";
  if (costs.suggestedSellingPrice > settings.targetMaxPrice) return "Price Review";
  if (score >= BUY_THRESHOLD) {
    return qualityRisk <= 2 || aesthetic <= 2 ? "Maybe" : "Buy";
  }
  if (score >= MAYBE_THRESHOLD) return "Maybe";
  return "Reject";
}

function decisionReason(product) {
  const costs = calculateCosts(product);
  const score = calculateScore(product);
  const qualityRisk = clampScore(product.scores?.qualityRisk);
  const aesthetic = clampScore(product.scores?.aaynaFit);

  if (!costs.hasCostData) return "Missing unit cost, so pricing cannot be evaluated.";
  if (costs.suggestedSellingPrice > settings.hardRejectPrice) {
    return `Suggested selling price is above the hard reject limit of ${money(settings.hardRejectPrice)}.`;
  }
  if (costs.suggestedSellingPrice > settings.targetMaxPrice) {
    return `Suggested selling price is above the target max price of ${money(settings.targetMaxPrice)}.`;
  }
  if (qualityRisk <= 2) return "Quality/risk score is too low for a Buy decision.";
  if (aesthetic <= 2) return "AAYNA aesthetic fit score is too low for a Buy decision.";
  if (score < MAYBE_THRESHOLD) return `Total score is below the Maybe threshold of ${MAYBE_THRESHOLD}.`;
  if (score < BUY_THRESHOLD) return `Total score is between ${MAYBE_THRESHOLD} and ${BUY_THRESHOLD - 1}, so partner review is recommended.`;
  if (costs.profitMargin !== "" && costs.profitMargin < settings.lowProfitThreshold / 100) {
    return `Profit margin is below the low-profit threshold of ${settings.lowProfitThreshold}%.`;
  }
  if (toNumber(product.moq) > settings.moqWarningThreshold) {
    return `MOQ is above the warning threshold of ${settings.moqWarningThreshold}.`;
  }
  return "Good candidate based on score, price, quality, and aesthetic fit.";
}

function readyForWebsiteUpload(product) {
  if (hasProvisionalScoutSku(product)) return false;
  return ["productNameFinalized", "skuFinalized", "photosReady", "descriptionReady", "priceApproved"]
    .every((key) => product[key] === "Yes")
    && product.skuFinalized === "Yes"
    && !isScoutSku(product.sku);
}

function isWebsiteExportReady(product) {
  if (hasProvisionalScoutSku(product)) return false;
  return readyForWebsiteUpload(product)
    || product.launchStatus === "website_ready"
    || product.launchStatus === "live"
    || Boolean(product.launchChecklist?.websiteExportReady);
}

function isPotentialWebsiteExportReadyIgnoringSku(product) {
  return ["productNameFinalized", "photosReady", "descriptionReady", "priceApproved"]
    .every((key) => product[key] === "Yes")
    || product.launchStatus === "website_ready"
    || product.launchStatus === "live"
    || Boolean(product.launchChecklist?.websiteExportReady);
}

function isApproved(product) {
  return product.approvalStatus === "Approved";
}

function launchChecklistProgress(product) {
  const checklist = product.launchChecklist || DEFAULT_LAUNCH_CHECKLIST;
  const ready = LAUNCH_CHECKLIST.filter(([key]) => Boolean(checklist[key])).length;
  const missing = LAUNCH_CHECKLIST
    .filter(([key]) => !checklist[key])
    .map(([, label]) => label);
  if (hasMissingPublicStock(product)) missing.push("Stock quantity");
  return {
    ready,
    total: LAUNCH_CHECKLIST.length,
    missing
  };
}

function isHighRisk(product) {
  return product.fragilityLevel === "High"
    || product.courierRisk === "High"
    || clampScore(product.scores?.qualityRisk) <= 2;
}

function autoFlag(product) {
  const costs = calculateCosts(product);
  const score = calculateScore(product);
  if (!costs.hasCostData) return "Incomplete cost data";
  if (costs.suggestedSellingPrice > settings.hardRejectPrice) return `Price above hard reject limit (${money(settings.hardRejectPrice)})`;
  if (costs.suggestedSellingPrice > settings.targetMaxPrice) return `Price above ${money(settings.targetMaxPrice)}`;
  if (clampScore(product.scores?.qualityRisk) <= 2) return "Quality/risk too low";
  if (clampScore(product.scores?.aaynaFit) <= 2) return "Aesthetic fit too low";
  if (score < MAYBE_THRESHOLD) return "Score below Maybe threshold";
  if (costs.profitMargin !== "" && costs.profitMargin < settings.lowProfitThreshold / 100) return "Low profit margin";
  if (toNumber(product.moq) > settings.moqWarningThreshold) return "MOQ too high";
  return "Good candidate";
}

function productWithComputed(product, index = 0) {
  const costs = calculateCosts(product);
  const score = calculateScore(product);
  const decision = calculateDecision(product);
  const sku = generateSku(product, index);
  return {
    ...product,
    sku,
    enteredSku: product.sku || "",
    costs,
    score,
    decision,
    decisionReason: decisionReason(product),
    readyForWebsiteUpload: isWebsiteExportReady(product),
    highRisk: isHighRisk(product),
    autoFlag: autoFlag(product)
  };
}

function getFormProduct() {
  const scores = {};
  SCORE_FIELDS.forEach(([key]) => {
    scores[key] = clampScore(document.querySelector(`#score-${key}`).value);
  });

  const product = {
    id: document.querySelector("#productId").value || crypto.randomUUID(),
    scores,
    updatedAt: new Date().toISOString()
  };

  FORM_FIELDS.forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (!input) return;
    if (input.type === "number") {
      product[id] = input.value === "" ? "" : Number(input.value);
    } else {
      product[id] = input.value.trim();
    }
  });

  return normalizeProduct(product);
}

function setFormProduct(product = {}) {
  const normalized = normalizeProduct(product);
  document.querySelector("#productId").value = product.id || "";
  FORM_FIELDS.forEach((id) => {
    const input = document.querySelector(`#${id}`);
    if (!input) return;
    input.value = normalized[id] ?? "";
  });
  SCORE_FIELDS.forEach(([key]) => {
    document.querySelector(`#score-${key}`).value = normalized.scores?.[key] ?? 3;
  });
  document.querySelector("#formTitle").textContent = product.id ? "Edit Product Candidate" : "Add Product Candidate";
  document.querySelector("#cancelEditBtn").classList.toggle("hidden", !product.id);
  renderCalculatorPreview();
}

function showMessage(type, text) {
  formMessage.textContent = text;
  formMessage.className = `message ${type}`;
}

function hideMessage() {
  formMessage.textContent = "";
  formMessage.className = "message hidden";
}

function validateProduct(product) {
  const errors = [];
  if (!product.productName) errors.push("Product name is required.");
  if (!product.category) errors.push("Category is required.");
  if (!product.sourcePlatform) errors.push("Source platform is required.");
  if (!product.sourceUrl) errors.push("Supplier/source URL is required.");
  if (product.sourceUrl && !isValidHttpUrl(product.sourceUrl)) errors.push("Supplier/source URL must start with http:// or https://.");
  if (product.productImageLink && !isValidHttpUrl(product.productImageLink)) errors.push("Product image/link must start with http:// or https:// when provided.");
  if (product.unitCost === "" || product.unitCost === null || product.unitCost === undefined) {
    errors.push("Unit cost is required.");
  }
  if (Number(product.unitCost) <= 0) errors.push("Unit cost must be greater than 0.");
  if (toNumber(product.shippingCostBdt) < 0) errors.push("Shipping cost cannot be negative.");
  if (hasValue(product.customsDutyPct) && (Number(product.customsDutyPct) < 0 || Number(product.customsDutyPct) > 100)) {
    errors.push("Customs/duty % must be between 0 and 100.");
  }
  if (hasValue(product.miscFeesBdt) && Number(product.miscFeesBdt) < 0) errors.push("Misc fees cannot be negative.");
  if (!Number.isInteger(Number(product.moq)) || Number(product.moq) < 1) errors.push("MOQ must be a whole number of at least 1.");
  ["recommendedTestQuantity", "finalApprovedQuantity", "soldCount", "reviewCount", "quantityReceived", "defectCount"].forEach((field) => {
    if (hasValue(product[field]) && (!Number.isInteger(Number(product[field])) || Number(product[field]) < 0)) {
      errors.push(`${humanizeField(field)} must be a non-negative whole number.`);
    }
  });
  ["supplierRating", "productRating"].forEach((field) => {
    if (hasValue(product[field]) && (Number(product[field]) < 0 || Number(product[field]) > 5)) {
      errors.push(`${humanizeField(field)} must be between 0 and 5.`);
    }
  });
  ["actualProductCost", "actualShippingCost", "actualSellingPrice", "competitorPrice"].forEach((field) => {
    if (hasValue(product[field]) && Number(product[field]) < 0) errors.push(`${humanizeField(field)} cannot be negative.`);
  });
  if (hasValue(product.quantityReceived) && hasValue(product.defectCount) && Number(product.defectCount) > Number(product.quantityReceived)) {
    errors.push("Defect count cannot exceed quantity received.");
  }
  SCORE_FIELDS.forEach(([key, label]) => {
    const value = Number(product.scores?.[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) errors.push(`${label} score must be a whole number from 1 to 5.`);
  });
  const computedDecision = calculateDecision(product);
  if (product.approvalStatus === "Approved" && computedDecision === "Reject" && !product.approvalOverrideReason) {
    errors.push("Approval override reason is required before approving a product with a Reject decision.");
  }
  return errors;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function humanizeField(field) {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function resetForm() {
  form.reset();
  const blank = { ...FIELD_DEFAULTS, scores: Object.fromEntries(SCORE_FIELDS.map(([key]) => [key, 3])) };
  setFormProduct(blank);
  document.querySelector("#productId").value = "";
  document.querySelector("#formTitle").textContent = "Add Product Candidate";
  document.querySelector("#cancelEditBtn").classList.add("hidden");
}

function renderCalculatorPreview() {
  const product = getFormProduct();
  const computed = productWithComputed(product);
  if (!computed.costs.hasCostData) {
    calculatorPreview.innerHTML = `
      <div class="calc-item calc-wide">
        <span>Cost & pricing</span>
        <strong>Incomplete cost data</strong>
      </div>
      <div class="calc-item">
        <span>Score</span>
        <strong>${computed.score}/100</strong>
      </div>
      <div class="calc-item">
        <span>Auto flag</span>
        <strong>${computed.autoFlag}</strong>
      </div>
    `;
    return;
  }
  const items = [
    ["Unit cost BDT", money(computed.costs.unitCostBdt)],
    ["Landed cost", money(computed.costs.estimatedLandedCost)],
    ["Selling price", money(computed.costs.suggestedSellingPrice)],
    ["Expected profit", money(computed.costs.expectedProfit)],
    ["Profit margin", percent(computed.costs.profitMargin)],
    ["Total purchase cost", money(computed.costs.totalPurchaseCost)],
    ["Actual profit", computed.costs.actualProfit === "" ? "-" : money(computed.costs.actualProfit)],
    ["Actual margin", computed.costs.actualProfitMargin === "" ? "-" : percent(computed.costs.actualProfitMargin)],
    ["Final stock accepted", computed.costs.finalStockAccepted === "" ? "-" : computed.costs.finalStockAccepted],
    ["Score", `${computed.score}/100`],
    ["Decision", computed.decision],
    ["Auto flag", computed.autoFlag || "-"]
  ];

  calculatorPreview.innerHTML = items.map(([label, value]) => `
    <div class="calc-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderSettings() {
  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    const input = document.querySelector(`#${key}`);
    if (input) input.value = settings[key];
  });
  const maxPriceInput = document.querySelector("#scoutMaxPrice");
  if (maxPriceInput && !maxPriceInput.value) maxPriceInput.value = settings.targetMaxPrice;
}

function renderStorageStatus() {
  const mode = buyosStorage.getStorageMode();
  const user = buyosStorage.getCurrentUser();
  const workspace = buyosStorage.getCurrentWorkspace();
  const configured = buyosStorage.isSupabaseConfigured;
  const diagnostics = buyosStorage.getStorageDiagnostics();
  const statusParts = [];

  if (!configured) {
    statusParts.push("Local mode: Supabase is not configured.");
  } else if (mode === "cloud" && user && workspace) {
    statusParts.push("Storage mode: Cloud");
    statusParts.push(`Signed in: ${user.email || "Supabase user"}`);
    statusParts.push(`Workspace: ${workspace.name || "AAYNA BuyOS"}`);
    if (storageState.error) statusParts.push(storageState.error);
  } else if (user && workspace) {
    statusParts.push("Storage mode: Local fallback");
    statusParts.push(buyosStorage.getStorageError() || "Cloud load failed. Local mode is still available.");
  } else if (user && !workspace) {
    statusParts.push("Storage mode: Local fallback");
    statusParts.push("No BuyOS workspace found for this account. Add the user to buyos_members in Supabase.");
  } else {
    statusParts.push("Storage mode: Local");
    statusParts.push("Cloud sync requires sign-in.");
  }

  storageStatusText.textContent = statusParts.join(" | ");
  storageDebugText.textContent = [
    `Cloud rows loaded: ${diagnostics.cloudRowsLoaded}`,
    `Cloud products mapped: ${diagnostics.cloudProductsLoaded}`,
    `Active products shown: ${products.length}`,
    `Local products stored: ${diagnostics.localProductsStored}`,
    `Last cloud reload time: ${diagnostics.lastCloudReloadAt ? new Date(diagnostics.lastCloudReloadAt).toLocaleString() : "Never"}`
  ].join(" | ");
  loginForm.classList.toggle("hidden", !configured || Boolean(user));
  signOutBtn.classList.toggle("hidden", !configured || !user);
  reloadCloudBtn.classList.toggle("hidden", !(configured && mode === "cloud" && user && workspace));
  migrateCloudBtn.classList.toggle("hidden", !(configured && mode === "cloud" && user && workspace));
}

function renderStats() {
  const computed = products.map(productWithComputed);
  const approved = computed.filter(isApproved);
  const approvedCost = approved.reduce((sum, product) => sum + toNumber(product.costs.totalPurchaseCost), 0);
  const remaining = settings.monthlyBudget - approvedCost;
  const used = settings.monthlyBudget > 0 ? approvedCost / settings.monthlyBudget : 0;
  const stats = [
    ["Total products", computed.length],
    ["Buy count", computed.filter((product) => product.decision === "Buy").length],
    ["Maybe count", computed.filter((product) => product.decision === "Maybe").length],
    ["Price Review", computed.filter((product) => product.decision === "Price Review").length],
    ["Reject count", computed.filter((product) => product.decision === "Reject").length],
    ["Approved purchase cost", money(approvedCost)],
    ["Remaining budget", money(remaining)],
    ["Budget used", percent(used)],
    ["Website ready", computed.filter((product) => product.readyForWebsiteUpload).length],
    ["High-risk products", computed.filter((product) => product.highRisk).length],
    ["Partner review", computed.filter(needsPartnerReview).length],
    ["Launch batch", approved.filter((product) => product.launchStatus).length],
    ["Launch website ready", computed.filter((product) => product.launchStatus === "website_ready" || product.launchStatus === "live").length],
    ["Live", computed.filter((product) => product.launchStatus === "live").length],
    ["Photo/content pending", approved.filter((product) => !product.launchChecklist?.imagesReady || !product.launchChecklist?.instagramContentPlanned).length]
  ];

  document.querySelector("#statsGrid").innerHTML = stats.map(([label, value]) => `
    <div class="stat-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function needsPartnerReview(product) {
  return (product.decision === "Maybe" || product.decision === "Price Review")
    && product.approvalStatus !== "Approved"
    && product.approvalStatus !== "Rejected";
}

function renderCompactList(id, items, emptyMessage = emptyProductsMessage()) {
  const container = document.querySelector(`#${id}`);
  if (!items.length) {
    container.innerHTML = emptyState(emptyMessage);
    return;
  }
  container.innerHTML = items.map((product) => `
    <div class="compact-item">
      <div class="compact-item-body">
        <strong class="compact-title" title="${escapeAttribute(displayProductName(product))}">${escapeHtml(displayProductName(product))}</strong>
        <div class="meta compact-meta" title="${escapeAttribute(compactProductMeta(product))}">${escapeHtml(compactProductMeta(product))}</div>
      </div>
      <span class="pill ${normalizeDecision(product.decision)}">${product.score}/100</span>
    </div>
  `).join("");
}

function displayProductName(product) {
  return product.productName || "Unnamed product";
}

function compactProductMeta(product) {
  return `${product.sku || "-"} - ${product.category || "-"} - ${moneyOrDash(product.costs.suggestedSellingPrice)}`;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function emptyProductsMessage() {
  return buyosStorage.getStorageMode() === "cloud"
    ? "Cloud workspace is empty. Add a product or migrate local data."
    : "No products yet. Add your first product candidate or load demo samples.";
}

function renderDashboardLists() {
  const computed = products.map(productWithComputed);
  renderCompactList("topProducts", [...computed].sort((a, b) => b.score - a.score).slice(0, 5), products.length ? "No products to show." : emptyProductsMessage());
  renderCompactList("partnerReview", computed.filter(needsPartnerReview).sort((a, b) => b.score - a.score).slice(0, 5), products.length ? "No partner-review products right now." : emptyProductsMessage());
  renderCompactList("websiteReady", computed.filter((product) => product.readyForWebsiteUpload).slice(0, 5), products.length ? "No website-ready products yet." : emptyProductsMessage());
}

function renderScoutTasks() {
  const tasks = normalizeSourceScoutTasks(settings.sourceScoutTasks);
  if (!tasks.length) {
    scoutTasksList.innerHTML = emptyState("No search intents yet. Add keywords above to queue future backend scouting.");
    return;
  }
  scoutTasksList.innerHTML = tasks.slice(0, 8).map((task) => `
    <div class="compact-item scout-task-item">
      <div>
        <strong>${escapeHtml(task.keyword)}</strong>
        <div class="meta">${escapeHtml(task.sourcePlatform)} - ${escapeHtml(task.category)} - status ${escapeHtml(task.status)}</div>
        <div class="meta">Created ${escapeHtml(task.createdAt?.slice(0, 10) || "-")} - Last run ${escapeHtml(task.lastRunAt?.slice(0, 16) || "Never")}</div>
        <div class="meta">Discovered ${toNumber(task.discoveredCount)} - Imported ${toNumber(task.importedCount)} - Skipped ${toNumber(task.skippedDuplicateCount)} - Failed ${toNumber(task.failedCount)}</div>
        ${task.lastError ? `<div class="meta error-text">${escapeHtml(task.lastError)}</div>` : ""}
      </div>
      <div class="task-actions">
        <span class="pill maybe">${escapeHtml(task.status)}</span>
        ${task.status === "paused"
          ? `<button class="button ghost compact" data-task-action="resume" data-task-id="${escapeAttribute(task.id)}" type="button">Resume</button>`
          : `<button class="button ghost compact" data-task-action="pause" data-task-id="${escapeAttribute(task.id)}" type="button">Pause</button>`}
        <button class="button ghost compact delete-subtle" data-task-action="delete" data-task-id="${escapeAttribute(task.id)}" type="button">Delete</button>
      </div>
    </div>
  `).join("");
}

function normalizeSourceScoutTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).map((task) => ({
    id: task.id || crypto.randomUUID(),
    keyword: task.keyword || "",
    category: task.category || "Other",
    sourcePlatform: task.sourcePlatform || "Other",
    maxTargetSellingPrice: task.maxTargetSellingPrice ?? task.maxTargetPrice ?? settings.targetMaxPrice,
    status: task.status === "queued" ? "pending" : (task.status || "pending"),
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
    discoveredCount: toNumber(task.discoveredCount),
    importedCount: toNumber(task.importedCount),
    skippedDuplicateCount: toNumber(task.skippedDuplicateCount),
    failedCount: toNumber(task.failedCount),
    lastRunAt: task.lastRunAt || null,
    lastError: task.lastError || ""
  })).filter((task) => task.keyword);
}

function updateFilterOptions() {
  const selectedCategory = document.querySelector("#categoryFilter").value;
  const selectedSource = document.querySelector("#sourceFilter").value;
  const categories = [...new Set([...DROPDOWNS.category, ...products.map((product) => product.category).filter(Boolean)])];
  const sources = [...new Set([...DROPDOWNS.sourcePlatform, ...products.map((product) => product.sourcePlatform).filter(Boolean)])];
  document.querySelector("#categoryFilter").innerHTML = `<option value="">All</option>${categories.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
  document.querySelector("#sourceFilter").innerHTML = `<option value="">All</option>${sources.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}`;
  if (categories.includes(selectedCategory)) document.querySelector("#categoryFilter").value = selectedCategory;
  if (sources.includes(selectedSource)) document.querySelector("#sourceFilter").value = selectedSource;
}

function getFilteredProducts() {
  const decision = document.querySelector("#decisionFilter").value;
  const category = document.querySelector("#categoryFilter").value;
  const source = document.querySelector("#sourceFilter").value;
  const minScore = Number(document.querySelector("#minScoreFilter").value || 0);
  const under700 = document.querySelector("#under700Filter").checked;
  const approved = document.querySelector("#approvedFilter").checked;
  const watchlist = document.querySelector("#watchlistFilter").checked;
  const rejected = document.querySelector("#rejectedFilter").checked;
  const websiteReady = document.querySelector("#websiteReadyFilter").checked;
  const needsReview = document.querySelector("#needsReviewFilter").checked;
  const sourceScout = document.querySelector("#sourceScoutFilter").checked;
  const missingCost = document.querySelector("#missingCostFilter").checked;
  const hasDraftScore = document.querySelector("#hasDraftScoreFilter").checked;
  const readyHumanScoring = document.querySelector("#readyHumanScoringFilter").checked;

  return products.map(productWithComputed).filter((product) => {
    if (decision && product.decision !== decision) return false;
    if (category && product.category !== category) return false;
    if (source && product.sourcePlatform !== source) return false;
    if (product.score < minScore) return false;
    if (under700 && product.costs.suggestedSellingPrice > 700) return false;
    if (approved && product.approvalStatus !== "Approved") return false;
    if (watchlist && product.approvalStatus !== "On Hold") return false;
    if (rejected && product.approvalStatus !== "Rejected") return false;
    if (websiteReady && !product.readyForWebsiteUpload) return false;
    if (needsReview && !product.needsHumanReview) return false;
    if (sourceScout && !["source_scout", "source_discovery_worker"].includes(product.importedBy)) return false;
    if (missingCost && product.costs.hasCostData) return false;
    if (hasDraftScore && !product.draftScores) return false;
    if (readyHumanScoring && !(product.needsScoreReview && product.draftScores)) return false;
    return true;
  });
}

function renderProductList() {
  const container = document.querySelector("#productList");
  const filtered = getFilteredProducts();

  if (!filtered.length) {
    container.innerHTML = emptyState(products.length
      ? "No products match this filter."
      : emptyProductsMessage());
    return;
  }

  container.innerHTML = filtered.map((product) => `
    <article class="product-card">
      ${isRenderableImage(product.productImageLink)
        ? `<img class="product-image" src="${escapeAttribute(product.productImageLink)}" alt="${escapeAttribute(product.productName)}" />`
        : `<div class="product-image placeholder" aria-hidden="true"><strong>AAYNA</strong><span>Image pending</span></div>`}
      <div>
        <div class="product-head">
          <div>
            <h3 title="${escapeAttribute(displayProductName(product))}">${escapeHtml(displayProductName(product))}</h3>
            <div class="meta">${escapeHtml(product.sku)} - ${escapeHtml(product.sourcePlatform)} - ${escapeHtml(product.category)}</div>
          </div>
          <div class="status-line">
            <span class="pill ${normalizeDecision(product.decision)}">${product.decision}</span>
            <span class="pill">${product.score}/100</span>
            <span class="pill">${escapeHtml(product.approvalStatus)}</span>
            ${product.needsHumanReview ? '<span class="pill maybe">Needs review</span>' : ""}
            ${hasProvisionalScoutSku(product) ? '<span class="pill maybe">Provisional SKU</span>' : ""}
            ${product.readyForWebsiteUpload ? '<span class="pill buy">Website ready</span>' : ""}
          </div>
        </div>
        <div class="product-meta">
          ${product.costs.hasCostData
            ? `<span class="metric-pill"><span>Selling</span><strong>${money(product.costs.suggestedSellingPrice)}</strong></span>
              <span class="metric-pill"><span>Landed</span><strong>${money(product.costs.estimatedLandedCost)}</strong></span>
              <span class="metric-pill"><span>Margin</span><strong>${percent(product.costs.profitMargin)}</strong></span>
              <span class="metric-pill"><span>Purchase</span><strong>${money(product.costs.totalPurchaseCost)}</strong></span>`
            : '<span class="pill reject">Incomplete cost data</span>'}
          <span class="metric-pill"><span>MOQ</span><strong>${toNumber(product.moq)}</strong></span>
          ${product.autoFlag ? `<span class="pill ${product.highRisk ? "reject" : "maybe"}">${escapeHtml(product.autoFlag)}</span>` : ""}
        </div>
        <div class="product-details">
          <div class="detail"><span>Supplier</span><strong>${escapeHtml(product.supplierName || "-")}</strong></div>
          <div class="detail"><span>Sold</span><strong>${toNumber(product.soldCount).toLocaleString()}</strong></div>
          <div class="detail"><span>Reviews</span><strong>${toNumber(product.reviewCount).toLocaleString()}</strong></div>
          <div class="detail"><span>Risk</span><strong>${escapeHtml(product.fragilityLevel)} / ${escapeHtml(product.courierRisk)}</strong></div>
          <div class="detail"><span>QC accepted</span><strong>${product.costs.finalStockAccepted === "" ? "Not arrived yet" : product.costs.finalStockAccepted}</strong></div>
          ${product.metadataStatus ? `<div class="detail"><span>Metadata</span><strong>${escapeHtml(product.metadataStatus)}</strong></div>` : ""}
          ${product.discoveredBy ? `<div class="detail"><span>Discovery</span><strong>${escapeHtml(product.sourceDiscoveryProvider || product.discoveredBy)}</strong></div>` : ""}
          ${product.sourceScoutKeyword ? `<div class="detail"><span>Keyword</span><strong>${escapeHtml(product.sourceScoutKeyword)}</strong></div>` : ""}
          ${product.listedSourcePrice ? `<div class="detail"><span>Listed source price</span><strong>${escapeHtml(product.listedSourceCurrency || "")} ${escapeHtml(product.listedSourcePrice)}</strong></div>` : ""}
        </div>
        <p class="decision-reason"><strong>Decision reason:</strong> ${escapeHtml(product.decisionReason)}</p>
        ${hasProvisionalScoutSku(product) ? '<p class="decision-reason"><strong>Provisional SKU:</strong> Replace SCOUT SKU with final AYN SKU before website export.</p>' : ""}
        ${product.missingFields?.length ? `<p class="decision-reason"><strong>Missing fields:</strong> ${escapeHtml(product.missingFields.join(", "))}</p>` : ""}
        ${product.draftScores ? `
          <div class="draft-score-box">
            <div class="draft-score-head">
              <strong>Draft score available</strong>
              <span class="pill maybe">Confidence: ${escapeHtml(product.draftScoreConfidence || "low")}</span>
            </div>
            <p>${escapeHtml(product.draftScoreReason || "Draft score needs human review.")}</p>
            <div class="meta">Source: ${escapeHtml(product.draftScoreSource || "draft")}</div>
            <div class="meta">Missing fields: ${escapeHtml((product.draftMissingFields || []).join(", ") || "None flagged")}</div>
            <div class="draft-score-grid">
              ${SCORE_FIELDS.map(([key, label]) => `<span>${escapeHtml(label)}: <strong>${clampScore(product.draftScores?.[key])}</strong></span>`).join("")}
            </div>
            <button class="button secondary compact" data-action="applyDraftScores" data-id="${product.id}" type="button">Apply draft scores</button>
          </div>
        ` : ""}
        ${product.approvalOverrideReason ? `<p class="override-reason"><strong>Approval override:</strong> ${escapeHtml(product.approvalOverrideReason)}</p>` : ""}
        ${product.reason ? `<p class="meta">${escapeHtml(product.reason)}</p>` : ""}
        <div class="card-action-row">
          <div class="primary-card-actions">
            <button class="button secondary" data-action="approve" data-id="${product.id}" type="button">Approve</button>
            <button class="button secondary" data-action="watchlist" data-id="${product.id}" type="button">Watchlist</button>
            <button class="button danger" data-action="reject" data-id="${product.id}" type="button">Reject</button>
          </div>
          <details class="more-actions">
            <summary>More actions</summary>
            <div class="more-actions-menu">
              <button class="button ghost compact" data-action="ordered" data-id="${product.id}" type="button">Mark ordered</button>
              <button class="button ghost compact" data-action="arrived" data-id="${product.id}" type="button">Mark arrived</button>
              <button class="button ghost compact" data-action="websiteReady" data-id="${product.id}" type="button">Mark website ready</button>
              <button class="button ghost compact" data-action="edit" data-id="${product.id}" type="button">Edit</button>
              <button class="button ghost compact delete-subtle" data-action="delete" data-id="${product.id}" type="button">Delete</button>
              ${product.sourceUrl ? `<a class="button ghost compact" href="${escapeAttribute(product.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
            </div>
          </details>
        </div>
      </div>
    </article>
  `).join("");
}

function renderLaunchBatch() {
  const container = document.querySelector("#launchBatchList");
  const approvedProducts = products.map(productWithComputed).filter(isApproved);

  if (!approvedProducts.length) {
    container.innerHTML = emptyState("No approved products yet. Approve a product to add it to the Launch Batch.");
    return;
  }

  container.innerHTML = approvedProducts.map((product) => {
    const progress = launchChecklistProgress(product);
    const publicStock = getPublicStockQuantity(product);
    return `
      <article class="launch-card">
        <div class="launch-card-main">
          <div>
            <p class="eyebrow">Launch Batch</p>
            <h3>${escapeHtml(product.productName)}</h3>
            <div class="meta">${escapeHtml(product.sku)} - ${escapeHtml(product.category)} - ${escapeHtml(product.sourcePlatform)}</div>
          </div>
          <div class="status-line">
            <span class="pill ${normalizeDecision(product.decision)}">${product.decision}</span>
            <span class="pill">${product.score}/100</span>
            <span class="pill">${progress.ready}/${progress.total} ready</span>
          </div>
        </div>
        <div class="launch-grid">
          <label class="launch-status-field">
            Launch status
            <select data-launch-status="${product.id}">
              ${LAUNCH_STATUSES.map(([value, label]) => `<option value="${value}" ${product.launchStatus === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <div class="detail"><span>Purchase cost</span><strong>${moneyOrDash(product.costs.totalPurchaseCost)}</strong></div>
          <div class="detail"><span>Selling price</span><strong>${moneyOrDash(product.costs.suggestedSellingPrice)}</strong></div>
          <div class="detail"><span>Expected profit</span><strong>${moneyOrDash(product.costs.expectedProfit)}</strong></div>
          <div class="detail ${publicStock <= 0 ? "stock-warning" : ""}"><span>Website stock</span><strong>${publicStock > 0 ? publicStock : "Missing - exports as 0"}</strong></div>
        </div>
        <div class="launch-missing">
          <strong>Missing:</strong> ${progress.missing.length ? progress.missing.map(escapeHtml).join(", ") : "All checklist items ready"}
        </div>
        <div class="launch-checklist">
          ${LAUNCH_CHECKLIST.map(([key, label]) => `
            <label class="check-filter launch-check">
              <input type="checkbox" data-launch-check="${product.id}" data-check-key="${key}" ${product.launchChecklist?.[key] ? "checked" : ""} />
              ${escapeHtml(label)}
            </label>
          `).join("")}
        </div>
        ${product.sourceUrl ? `<a class="source-link" href="${escapeAttribute(product.sourceUrl)}" target="_blank" rel="noreferrer">Open internal source link</a>` : ""}
      </article>
    `;
  }).join("");
}

function isRenderableImage(value) {
  return /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(value || "");
}

function renderAll() {
  products = products.map(normalizeProduct);
  renderStorageStatus();
  renderStats();
  renderDashboardLists();
  renderScoutTasks();
  updateFilterOptions();
  renderProductList();
  renderLaunchBatch();
  renderCalculatorPreview();
}

async function setProductPatch(id, patch) {
  products = products.map((product) => product.id === id ? normalizeProduct({ ...product, ...patch, updatedAt: new Date().toISOString() }) : product);
  const updated = products.find((product) => product.id === id);
  if (updated) {
    const saved = await saveProductToStorage(updated);
    products = products.map((product) => product.id === id ? saved : product);
  }
  renderAll();
}

async function approveProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const computed = productWithComputed(product);
  const needsOverride = product.approvalStatus === "Rejected" || computed.decision === "Reject";
  if (needsOverride) {
    const reason = prompt(`"${product.productName}" is rejected by status or decision. Enter an override reason to approve it:`);
    if (!reason || !reason.trim()) {
      showMessage("error", "Approval blocked. Rejected products require an override reason before approval.");
      return;
    }
    await setProductPatch(id, {
      approvalStatus: "Approved",
      approvalOverrideReason: reason.trim(),
      launchStatus: product.launchStatus || "shortlisted",
      dateDecided: TODAY
    });
    showMessage("success", `"${product.productName}" was approved with an override reason.`);
    return;
  }

  await setProductPatch(id, { approvalStatus: "Approved", launchStatus: product.launchStatus || "shortlisted", dateDecided: TODAY });
  showMessage("success", `"${product.productName}" was approved.`);
}

async function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  if (!confirm(`Delete "${product.productName}"?`)) return;
  try {
    await buyosStorage.deleteProduct(id);
    products = products.filter((item) => item.id !== id);
    renderAll();
    showMessage("success", `"${product.productName}" was deleted.`);
  } catch (error) {
    showMessage("error", `Cloud save failed: ${error.message || "Could not delete product"}`);
  }
}

function exportApprovedCsv() {
  const computedProducts = products.map(productWithComputed);
  const skippedProvisionalProducts = computedProducts.filter((product) =>
    product.approvalStatus === "Approved"
    && hasProvisionalScoutSku(product)
    && isPotentialWebsiteExportReadyIgnoringSku(product)
  );
  const exportRows = computedProducts
    .filter((product) => product.approvalStatus === "Approved"
      && product.readyForWebsiteUpload
      && !hasProvisionalScoutSku(product));

  if (!exportRows.length) {
    if (skippedProvisionalProducts.length) {
      alert(`No approved website-ready products were exported. Replace provisional SCOUT SKUs with final AYN SKUs first:\n\n${skippedProvisionalProducts.map(productExportLabel).join("\n")}`);
      return;
    }
    alert("No approved website-ready products to export yet.");
    return;
  }

  if (skippedProvisionalProducts.length) {
    alert(`Some products were skipped because they still use provisional SCOUT SKUs:\n\n${skippedProvisionalProducts.map(productExportLabel).join("\n")}`);
  }

  const { uniqueRows, skippedDuplicates } = dedupeWebsiteExportRows(exportRows);

  if (skippedDuplicates.length) {
    alert(`Some duplicate website export rows were skipped. BuyOS did not delete any products:\n\n${skippedDuplicates.map(productExportLabel).join("\n")}`);
  }

  const missingStockProducts = uniqueRows.filter(hasMissingPublicStock);
  if (missingStockProducts.length) {
    alert(`Some website-ready products have missing or zero public stock. They will export with Stock Quantity 0:\n\n${missingStockProducts.map(productExportLabel).join("\n")}`);
  }

  const headers = [
    "SKU", "Slug", "Product Name", "Category", "Selling Price BDT", "Stock Quantity",
    "Image URL", "Public Status", "Short Description"
  ];

  const rows = uniqueRows.map((product) => [
    product.sku,
    websiteExportSlug(product),
    product.productName,
    product.category,
    product.costs.hasCostData ? product.costs.suggestedSellingPrice.toFixed(2) : "",
    getPublicStockQuantity(product),
    isRenderableImage(product.productImageLink) ? product.productImageLink : "",
    product.launchStatus === "live" ? "Live" : "Draft",
    product.productName
  ]);

  downloadCsv(headers, rows, `aayna-website-upload-${new Date().toISOString().slice(0, 10)}.csv`);
}

function dedupeWebsiteExportRows(exportRows) {
  const seenKeys = new Set();
  const uniqueRows = [];
  const skippedDuplicates = [];

  exportRows.forEach((product) => {
    const key = websiteExportDedupeKey(product);
    if (seenKeys.has(key)) {
      skippedDuplicates.push(product);
      return;
    }
    seenKeys.add(key);
    uniqueRows.push(product);
  });

  return { uniqueRows, skippedDuplicates };
}

function websiteExportDedupeKey(product) {
  const sku = normalizeKey(product.enteredSku ?? product.sku);
  if (sku) return `sku:${sku}`;

  const explicitSlug = normalizeKey(product.slug);
  if (explicitSlug) return `slug:${explicitSlug}`;

  const generatedSlug = normalizeKey(websiteExportSlug(product));
  if (generatedSlug) return `slug:${generatedSlug}`;

  const id = normalizeKey(product.id);
  if (id) return `id:${id}`;

  return [
    "identity",
    normalizeKey(product.productName),
    normalizeKey(product.category),
    product.costs?.hasCostData ? Number(product.costs.suggestedSellingPrice).toFixed(2) : "no-price"
  ].join(":");
}

function websiteExportSlug(product) {
  return product.slug || slugify(product.productName || product.sku);
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function productExportLabel(product) {
  return `${product.productName || "Unnamed product"}${product.sku ? ` (${product.sku})` : ""}`;
}

function productIdentityKeys(product) {
  return [
    product.sourceUrl ? `source:${normalizeUrl(product.sourceUrl)}` : "",
    product.sku ? `sku:${normalizeKey(product.sku)}` : "",
    product.slug ? `slug:${normalizeKey(product.slug)}` : "",
    product.productName ? `namecat:${normalizeKey(product.productName)}:${normalizeKey(product.category)}` : ""
  ].filter(Boolean);
}

function hasProductIdentityMatch(candidate, existingProducts) {
  const candidateKeys = productIdentityKeys(candidate);
  if (!candidateKeys.length) return false;
  const existingKeys = new Set(existingProducts.flatMap(productIdentityKeys));
  return candidateKeys.some((key) => existingKeys.has(key));
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return normalizeKey(value);
  }
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferProductNameFromUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const lastUsefulPart = [...parts].reverse().find((part) => !/^\d+$/.test(part) && !/^item$/i.test(part));
    const raw = lastUsefulPart || url.hostname.replace(/^www\./, "");
    const cleaned = decodeURIComponent(raw)
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_+]+/g, " ")
      .replace(/\b(item|product|detail|html)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return titleCase(cleaned) || "Imported candidate";
  } catch {
    return "Imported candidate";
  }
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function sourceScoutDraftScores(productName, category, sourcePlatform, maxTargetPrice) {
  const text = `${productName} ${category}`.toLowerCase();
  const feminineWords = ["gold", "pearl", "rose", "heart", "bow", "flower", "cute", "charm", "bead"];
  const trendWords = ["hoop", "clip", "pearl", "choker", "layer", "mini", "viral", "korean", "minimal"];
  const contentWords = ["earring", "necklace", "ring", "hair", "sunglasses", "bag", "scarf"];
  const isAccessory = contentWords.some((word) => text.includes(word)) || category !== "Other";
  const feminine = feminineWords.some((word) => text.includes(word)) ? 4 : 3;
  const trendy = trendWords.some((word) => text.includes(word)) ? 4 : 3;
  const aaynaFit = isAccessory ? 4 : 3;
  const lightweight = ["Earrings", "Ring", "Hair Accessory", "Bracelet", "Necklace"].includes(category) ? 4 : 3;
  const demand = ["AliExpress", "SkyBuyBD", "1688"].includes(sourcePlatform) ? 3 : 2;
  const priceFit = Number(maxTargetPrice) <= settings.targetMaxPrice ? 3 : 4;
  const scores = {
    feminine,
    trendy,
    aaynaFit,
    easyToStyle: isAccessory ? 4 : 3,
    lightweight,
    reelsPhotos: isAccessory ? 4 : 3,
    giftability: ["Earrings", "Necklace", "Bracelet", "Ring", "Gift Set"].includes(category) ? 4 : 3,
    priceFit,
    demand,
    qualityRisk: 3
  };
  return Object.fromEntries(SCORE_FIELDS.map(([key]) => [key, clampScore(scores[key])]));
}

function sourceScoutMissingFields(product) {
  const checks = [
    ["unitCost", "unit cost"],
    ["supplierName", "supplier"],
    ["productImageLink", "image"],
    ["supplierRating", "supplier rating"],
    ["productRating", "product rating"],
    ["soldCount", "sold count"],
    ["reviewCount", "review count"]
  ];
  return checks.filter(([key]) => !hasValue(product[key])).map(([, label]) => label);
}

function createSourceScoutCandidate(sourceUrl, options, existingProducts = products) {
  const productName = inferProductNameFromUrl(sourceUrl);
  const category = options.category || "Other";
  const draftScores = sourceScoutDraftScores(productName, category, options.sourcePlatform, options.maxTargetPrice);
  const provisionalSku = generateScoutSku(category, existingProducts);
  const product = normalizeProduct({
    id: crypto.randomUUID(),
    dateAdded: TODAY,
    productName,
    slug: slugify(productName),
    sku: provisionalSku,
    provisionalSku: true,
    skuFinalized: "No",
    sourcePlatform: options.sourcePlatform,
    sourceUrl,
    category,
    supplierName: "",
    productImageLink: "",
    unitCost: "",
    productRating: "",
    supplierRating: "",
    soldCount: "",
    reviewCount: "",
    approvalStatus: "Pending",
    sourcingStatus: "Imported - Needs Review",
    launchStatus: "",
    importStatus: "needs_review",
    needsHumanReview: true,
    importedBy: "source_scout",
    importedAt: new Date().toISOString(),
    reason: "Imported by Source Scout. Needs manual cost, rating, supplier, and score review.",
    contentIdea: `${productName} styling idea for ${category}.`,
    aiToolUsed: "Source Scout Draft",
    manualScoreAdjusted: "No",
    draftScores,
    draftScoreReason: "Rule-based draft from URL text, source platform, and target category. Review before using.",
    draftScoreConfidence: "low",
    draftScoreSource: "source_scout_rules_v0.5",
    needsScoreReview: true
  });
  product.draftMissingFields = sourceScoutMissingFields(product);
  return product;
}

function exportDecisionCsv() {
  const exportRows = products
    .map(productWithComputed)
    .filter((product) => product.approvalStatus === "Approved" || product.approvalStatus === "Rejected");

  if (!exportRows.length) {
    alert("No approved or rejected products to export yet.");
    return;
  }

  const headers = [
    "SKU", "Product Name", "Category", "Source Platform", "Supplier Name", "Supplier/Source URL",
    "Approval Status", "Decision", "Decision Reason", "Override Reason", "Score",
    "Unit Cost", "Source Currency", "Shipping BDT", "Customs %", "Misc Fees BDT",
    "Landed Cost BDT", "Purchase Cost BDT", "Suggested Selling Price BDT",
    "Expected Profit BDT", "Profit Margin", "Auto Flag", "Internal Notes",
    "QC Notes", "Launch Status", "Launch Checklist", "Date Decided", "Sourcing Status"
  ];

  const rows = exportRows.map((product) => [
    product.sku,
    product.productName,
    product.category,
    product.sourcePlatform,
    product.supplierName,
    product.sourceUrl,
    product.approvalStatus,
    product.decision,
    product.decisionReason,
    product.approvalOverrideReason || "",
    product.score,
    product.unitCost,
    product.sourceCurrency,
    product.shippingCostBdt,
    product.customsDutyPct,
    product.miscFeesBdt,
    product.costs.hasCostData ? product.costs.estimatedLandedCost.toFixed(2) : "",
    product.costs.hasCostData ? product.costs.totalPurchaseCost.toFixed(2) : "",
    product.costs.hasCostData ? product.costs.suggestedSellingPrice.toFixed(2) : "",
    product.costs.hasCostData ? product.costs.expectedProfit.toFixed(2) : "",
    product.costs.profitMargin === "" ? "" : percent(product.costs.profitMargin),
    product.autoFlag,
    product.reason || "",
    product.qcNotes || "",
    product.launchStatus || "",
    JSON.stringify(product.launchChecklist || DEFAULT_LAUNCH_CHECKLIST),
    product.dateDecided || "",
    product.sourcingStatus
  ]);

  downloadCsv(headers, rows, `aayna-approved-rejected-${new Date().toISOString().slice(0, 10)}.csv`);
}

function downloadCsv(headers, rows, filename) {
  const csv = [headers, ...rows]
    .map((row) => row.map(formatCsvCell).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportBackupJson() {
  const backup = {
    app: BACKUP_APP_MARKER,
    schemaVersion: APP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    products: products.map(normalizeProduct),
    settings: { ...settings }
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aayna-buyos-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showMessage("success", "BuyOS backup JSON exported.");
}

async function importBackupJson(file) {
  if (!file) return;
  hideMessage();
  try {
    const text = await file.text();
    const backup = JSON.parse(text);
    const validation = validateBackupShape(backup);
    if (!validation.valid) {
      showMessage("error", validation.message);
      return;
    }

    const confirmed = confirm(`Import ${backup.products.length} products from this AAYNABuyOS backup? This will replace current local products and settings.`);
    if (!confirmed) {
      showMessage("error", "Import cancelled. Current data was not changed.");
      return;
    }

    products = backup.products.map(normalizeProduct);
    settings = { ...DEFAULT_SETTINGS, ...(backup.settings || {}) };
    await buyosStorage.saveBuyosState({ products, settings });
    renderSettings();
    resetForm();
    renderAll();
    showMessage("success", "BuyOS backup imported successfully.");
  } catch (error) {
    showMessage("error", `Import failed: ${error.message || "Invalid JSON file"}`);
  }
}

function validateBackupShape(backup) {
  if (!backup || typeof backup !== "object") {
    return { valid: false, message: "Import failed: backup JSON must be an object." };
  }
  const recognizable = backup.app === BACKUP_APP_MARKER || backup.schemaVersion || Array.isArray(backup.products);
  if (!recognizable) {
    return { valid: false, message: "Import failed: this does not look like an AAYNABuyOS backup." };
  }
  if (!Array.isArray(backup.products)) {
    return { valid: false, message: "Import failed: backup must include a products array." };
  }
  if (backup.settings && typeof backup.settings !== "object") {
    return { valid: false, message: "Import failed: settings must be an object when provided." };
  }
  return { valid: true, message: "" };
}

function formatCsvCell(cell) {
  let value = String(cell ?? "");
  if (/^[=+\-@]/.test(value)) value = `'${value}`;
  return `"${value.replaceAll('"', '""')}"`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDecision(decision) {
  return decision.toLowerCase().replace(/\s+/g, "-");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

form.addEventListener("input", renderCalculatorPreview);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();
  try {
    const product = getFormProduct();
    const validationErrors = validateProduct(product);
    if (validationErrors.length) {
      showMessage("error", validationErrors.join(" "));
      return;
    }

    const duplicateSource = product.sourceUrl
      && products.some((item) => item.id !== product.id && item.sourceUrl && item.sourceUrl.trim().toLowerCase() === product.sourceUrl.trim().toLowerCase());
    if (duplicateSource && !confirm("This source URL already exists. Save this candidate anyway?")) {
      showMessage("error", "Save cancelled because the source URL is already in the product list.");
      return;
    }

    const existingProduct = products.find((item) => item.id === product.id);
    const productToSave = normalizeProduct({ ...(existingProduct || {}), ...product });
    const savedProduct = await saveProductToStorage(productToSave);
    const existingIndex = products.findIndex((item) => item.id === savedProduct.id);
    if (existingIndex >= 0) {
      products[existingIndex] = savedProduct;
    } else {
      products.unshift(savedProduct);
    }
    resetForm();
    renderAll();
    showMessage("success", `"${savedProduct.productName}" was saved successfully.`);
  } catch (error) {
    showMessage("error", `Save failed: ${error.message || "Unknown error"}`);
  }
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  settings = {
    ...settings,
    usdRate: numberValue("usdRate", DEFAULT_SETTINGS.usdRate),
    rmbRate: numberValue("rmbRate", DEFAULT_SETTINGS.rmbRate),
    markupPercentage: numberValue("markupPercentage", DEFAULT_SETTINGS.markupPercentage),
    targetMaxPrice: numberValue("targetMaxPrice", DEFAULT_SETTINGS.targetMaxPrice),
    hardRejectPrice: numberValue("hardRejectPrice", DEFAULT_SETTINGS.hardRejectPrice),
    monthlyBudget: numberValue("monthlyBudget", DEFAULT_SETTINGS.monthlyBudget),
    lowProfitThreshold: numberValue("lowProfitThreshold", DEFAULT_SETTINGS.lowProfitThreshold),
    moqWarningThreshold: numberValue("moqWarningThreshold", DEFAULT_SETTINGS.moqWarningThreshold),
    defaultCustomsPct: numberValue("defaultCustomsPct", DEFAULT_SETTINGS.defaultCustomsPct),
    defaultMiscFee: numberValue("defaultMiscFee", DEFAULT_SETTINGS.defaultMiscFee)
  };
  try {
    await saveSettings();
    renderAll();
    showMessage("success", "Settings saved.");
  } catch {
    renderAll();
  }
});

sourceScoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();
  const sourcePlatform = document.querySelector("#scoutSourcePlatform").value;
  const category = document.querySelector("#scoutTargetCategory").value;
  const maxTargetPrice = numberValue("scoutMaxPrice", settings.targetMaxPrice);
  const urls = splitLines(document.querySelector("#scoutUrls").value)
    .filter((value) => /^https?:\/\//i.test(value));
  const keywords = splitLines(document.querySelector("#scoutKeywords").value);
  const options = { sourcePlatform, category, maxTargetPrice };
  let imported = 0;
  let skipped = 0;

  try {
    const savedCandidates = [];
    for (const sourceUrl of urls) {
      const candidate = createSourceScoutCandidate(sourceUrl, options, [...products, ...savedCandidates]);
      if (hasProductIdentityMatch(candidate, [...products, ...savedCandidates])) {
        skipped += 1;
        continue;
      }
      savedCandidates.push(await saveProductToStorage(candidate));
      imported += 1;
    }

    if (keywords.length) {
      const existingTasks = normalizeSourceScoutTasks(settings.sourceScoutTasks);
      const newTasks = keywords.map((keyword) => ({
        id: crypto.randomUUID(),
        keyword,
        sourcePlatform,
        category,
        maxTargetSellingPrice: maxTargetPrice,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        discoveredCount: 0,
        importedCount: 0,
        skippedDuplicateCount: 0,
        failedCount: 0,
        lastRunAt: null,
        lastError: ""
      }));
      settings = {
        ...settings,
        sourceScoutTasks: [...newTasks, ...existingTasks].slice(0, 100)
      };
      await saveSettings();
    }

    products = [...savedCandidates, ...products];
    sourceScoutForm.reset();
    document.querySelector("#scoutMaxPrice").value = settings.targetMaxPrice;
    renderAll();
    showMessage("success", `Imported ${imported} candidates. Skipped ${skipped} duplicates.`);
  } catch (error) {
    showMessage("error", `Source Scout import failed: ${error.message || "Could not save draft candidates"}`);
  }
});

scoutTasksList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-task-action]");
  if (!button) return;
  const { taskAction, taskId } = button.dataset;
  const tasks = normalizeSourceScoutTasks(settings.sourceScoutTasks);
  if (taskAction === "delete" && !confirm("Delete this Source Scout search task?")) return;
  const nextTasks = tasks
    .filter((task) => taskAction !== "delete" || task.id !== taskId)
    .map((task) => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        status: taskAction === "pause" ? "paused" : "pending",
        updatedAt: new Date().toISOString(),
        lastError: taskAction === "resume" ? "" : task.lastError
      };
    });
  settings = { ...settings, sourceScoutTasks: nextTasks };
  try {
    await saveSettings();
    renderAll();
    showMessage("success", "Source Scout task updated.");
  } catch {
    renderAll();
  }
});

document.querySelector("#productList").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "approve") await approveProduct(id);
  if (action === "watchlist") await setProductPatch(id, { approvalStatus: "On Hold" });
  if (action === "reject") await setProductPatch(id, { approvalStatus: "Rejected", dateDecided: TODAY });
  if (action === "ordered") await setProductPatch(id, { sourcingStatus: "Ordered", launchStatus: "ordered" });
  if (action === "arrived") await setProductPatch(id, { sourcingStatus: "Arrived", launchStatus: "received", arrivalDate: TODAY, qcStatus: "QC Pending" });
  if (action === "websiteReady") {
    const product = products.find((item) => item.id === id);
    if (product && hasProvisionalScoutSku(product)) {
      showMessage("error", "Replace the provisional SCOUT SKU with a final AYN SKU before marking website ready.");
      return;
    }
    await setProductPatch(id, {
      productNameFinalized: "Yes",
      skuFinalized: "Yes",
      photosReady: "Yes",
      descriptionReady: "Yes",
      priceApproved: "Yes",
      launchStatus: "website_ready",
      sourcingStatus: "Live on Website"
    });
  }
  if (action === "applyDraftScores") {
    const product = products.find((item) => item.id === id);
    if (product?.draftScores) {
      await setProductPatch(id, {
        scores: { ...product.draftScores },
        needsScoreReview: false,
        manualScoreAdjusted: "Yes",
        scoredBy: product.scoredBy || "Source Scout review",
        aiScoreDate: TODAY
      });
      showMessage("success", "Draft scores applied. Review and save any other missing fields before approval.");
    }
  }
  if (action === "delete") await deleteProduct(id);
  if (action === "edit") {
    const product = products.find((item) => item.id === id);
    if (product) {
      setFormProduct(product);
      document.querySelector("#candidate-form").scrollIntoView({ behavior: "smooth" });
    }
  }
});

document.querySelector("#launchBatchList").addEventListener("change", async (event) => {
  const statusProductId = event.target.dataset.launchStatus;
  if (statusProductId) {
    await setProductPatch(statusProductId, { launchStatus: event.target.value });
    showMessage("success", "Launch status updated.");
    return;
  }

  const checklistProductId = event.target.dataset.launchCheck;
  const checkKey = event.target.dataset.checkKey;
  if (checklistProductId && checkKey) {
    const product = products.find((item) => item.id === checklistProductId);
    if (!product) return;
    await setProductPatch(checklistProductId, {
      launchChecklist: {
        ...DEFAULT_LAUNCH_CHECKLIST,
        ...(product.launchChecklist || {}),
        [checkKey]: event.target.checked
      }
    });
    showMessage("success", "Launch checklist updated.");
  }
});

document.querySelectorAll("#decisionFilter, #categoryFilter, #sourceFilter, #minScoreFilter, #under700Filter, #approvedFilter, #watchlistFilter, #rejectedFilter, #websiteReadyFilter, #needsReviewFilter, #sourceScoutFilter, #missingCostFilter, #hasDraftScoreFilter, #readyHumanScoringFilter")
  .forEach((input) => input.addEventListener("input", renderProductList));

document.querySelector("#resetFormBtn").addEventListener("click", resetForm);
document.querySelector("#cancelEditBtn").addEventListener("click", resetForm);
document.querySelector("#exportCsvBtn").addEventListener("click", exportApprovedCsv);
document.querySelector("#exportDecisionCsvBtn").addEventListener("click", exportDecisionCsv);
document.querySelector("#exportBackupBtn").addEventListener("click", exportBackupJson);
document.querySelector("#importBackupInput").addEventListener("change", async (event) => {
  await importBackupJson(event.target.files?.[0]);
  event.target.value = "";
});
document.querySelector("#seedDataBtn").addEventListener("click", async () => {
  hideMessage();
  const stampedSamples = SAMPLE_PRODUCTS.map((product, index) => normalizeProduct({
    ...product,
    id: crypto.randomUUID(),
    sku: generateSku(product, index),
    slug: slugify(product.productName || generateSku(product, index)),
    updatedAt: new Date().toISOString()
  }));
  const newSamples = [];
  let skipped = 0;
  for (const sample of stampedSamples) {
    if (hasProductIdentityMatch(sample, [...products, ...newSamples])) {
      skipped += 1;
    } else {
      newSamples.push(sample);
    }
  }
  if (!newSamples.length && skipped) {
    showMessage("success", "Skipped duplicate sample products already in BuyOS.");
    return;
  }
  try {
    const savedSamples = [];
    for (const product of newSamples) {
      savedSamples.push(await saveProductToStorage(product));
    }
    products = [...savedSamples, ...products];
    renderAll();
    showMessage("success", skipped
      ? `Loaded ${savedSamples.length} demo products. Skipped duplicate sample products already in BuyOS.`
      : "Loaded 5 demo products covering Buy, Maybe, Price Review, Reject by price, and Reject by quality/aesthetic.");
  } catch (error) {
    showMessage("error", `Demo load failed: ${error.message || "Could not save sample products"}`);
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage();
  const email = document.querySelector("#loginEmail").value.trim();
  const password = document.querySelector("#loginPassword").value;
  if (!email || !password) {
    showMessage("error", "Enter email and password to sign in.");
    return;
  }
  try {
    storageState = await buyosStorage.signIn(email, password);
    products = (storageState.products || []).map(normalizeProduct);
    settings = { ...DEFAULT_SETTINGS, ...(storageState.settings || {}) };
    loginForm.reset();
    renderSettings();
    resetForm();
    renderAll();
    renderStorageStatus();
    showMessage("success", buyosStorage.getStorageMode() === "cloud" ? "Signed in and loaded cloud workspace." : "Signed in, but no workspace membership was found. Local mode remains available.");
  } catch (error) {
    showMessage("error", `Invalid login: ${error.message || "Could not sign in"}`);
  }
});

signOutBtn.addEventListener("click", async () => {
  storageState = await buyosStorage.signOut();
  products = (storageState.products || []).map(normalizeProduct);
  settings = { ...DEFAULT_SETTINGS, ...(storageState.settings || {}) };
  renderSettings();
  resetForm();
  renderAll();
  renderStorageStatus();
  showMessage("success", "Signed out. Local mode remains available.");
});

reloadCloudBtn.addEventListener("click", async () => {
  hideMessage();
  try {
    await loadActiveStorageState();
    renderSettings();
    resetForm();
    renderAll();
    if (buyosStorage.getStorageMode() !== "cloud") {
      showMessage("error", buyosStorage.getStorageError() || buyosStorage.getStorageStatus() || "Cloud load failed. Local mode is still available.");
    } else {
      showMessage("success", products.length === 0
        ? "Cloud workspace is empty. Add a product or migrate local data."
        : `Reloaded ${products.length} ${products.length === 1 ? "product" : "products"} from cloud.`);
    }
  } catch (error) {
    showMessage("error", `Cloud load failed: ${error.message || "Could not reload cloud data"}`);
  }
});

migrateCloudBtn.addEventListener("click", async () => {
  hideMessage();
  if (!confirm("Upload local BuyOS products and settings to this Supabase workspace? Local browser data will not be deleted.")) return;
  try {
    const result = await buyosStorage.migrateLocalToSupabase();
    await loadActiveStorageState();
    renderSettings();
    resetForm();
    renderAll();
    showMessage("success", `Migration complete. Uploaded ${result.uploaded}, skipped ${result.skipped}, failed ${result.failed}. Local data was not deleted.`);
  } catch (error) {
    showMessage("error", `Migration failed: ${error.message || "Could not migrate local data"}`);
  }
});

clearLocalDataBtn.addEventListener("click", async () => {
  hideMessage();
  if (!confirm("This clears local BuyOS data from this browser only. Cloud data is not deleted.")) return;
  buyosStorage.clearLocalBuyosData();
  if (buyosStorage.getStorageMode() !== "cloud") {
    await loadActiveStorageState();
    renderSettings();
    resetForm();
    renderAll();
  }
  showMessage("success", "Local BuyOS data cleared from this browser. Cloud data was not deleted.");
});

async function initializeApp() {
  initializeDropdowns();
  renderScoreInputs();
  await loadActiveStorageState();
  renderSettings();
  resetForm();
  renderAll();
}

initializeApp().catch((error) => {
  console.warn("BuyOS startup failed", { message: error?.message || "Unknown error" });
  showMessage("error", "Startup failed. Refresh and try again.");
});
