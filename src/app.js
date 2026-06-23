const TODAY = new Date().toISOString().slice(0, 10);

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
  moqWarningThreshold: 50
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
  manualScoreAdjusted: "No"
};

const FORM_FIELDS = [
  "sku", "dateAdded", "productName", "productImageLink", "category", "sourcePlatform", "sourceUrl",
  "supplierName", "unitCost", "sourceCurrency", "shippingCostBdt", "customsDutyPct", "miscFeesBdt",
  "reason", "contentIdea", "approvalStatus", "approvedBy", "dateDecided", "supplierRating",
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

let products = loadProducts();
let settings = loadSettings();

const form = document.querySelector("#productForm");
const settingsForm = document.querySelector("#settingsForm");
const scoreInputs = document.querySelector("#scoreInputs");
const calculatorPreview = document.querySelector("#calculatorPreview");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");
const formMessage = document.querySelector("#formMessage");

function loadProducts() {
  try {
    return JSON.parse(localStorage.getItem("aaynaProducts") || "[]").map(normalizeProduct);
  } catch {
    return [];
  }
}

function saveProducts() {
  localStorage.setItem("aaynaProducts", JSON.stringify(products));
}

function loadSettings() {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(localStorage.getItem("aaynaSettings") || "{}")
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem("aaynaSettings", JSON.stringify(settings));
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

function roundToWorkbookPrice(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value / 10) * 10 - 1;
}

function generateSku(product, index = products.length) {
  if (product.sku) return product.sku;
  if (!product.productName) return "";
  const prefix = CATEGORY_PREFIX[product.category] || "OTH";
  return `AYN-${prefix}-${String(index + 1).padStart(4, "0")}`;
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
      finalStockAccepted: product.quantityReceived !== "" && product.defectCount !== ""
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
  const actualLandedCost = product.actualProductCost !== "" && product.actualShippingCost !== ""
    ? toNumber(product.actualProductCost) + toNumber(product.actualShippingCost)
    : "";
  const actualProfit = product.actualSellingPrice !== "" && actualLandedCost !== ""
    ? toNumber(product.actualSellingPrice) - actualLandedCost
    : "";
  const actualProfitMargin = product.actualSellingPrice !== "" && toNumber(product.actualSellingPrice) > 0 && actualProfit !== ""
    ? actualProfit / toNumber(product.actualSellingPrice)
    : "";
  const finalStockAccepted = product.quantityReceived !== "" && product.defectCount !== ""
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

function readyForWebsiteUpload(product) {
  return ["productNameFinalized", "skuFinalized", "photosReady", "descriptionReady", "priceApproved"]
    .every((key) => product[key] === "Yes");
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
    costs,
    score,
    decision,
    readyForWebsiteUpload: readyForWebsiteUpload(product),
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
  if (product.unitCost === "" || product.unitCost === null || product.unitCost === undefined) {
    errors.push("Unit cost is required.");
  }
  if (Number(product.unitCost) < 0) errors.push("Unit cost cannot be negative.");
  return errors;
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
    document.querySelector(`#${key}`).value = settings[key];
  });
}

function renderStats() {
  const computed = products.map(productWithComputed);
  const approved = computed.filter((product) => product.approvalStatus === "Approved");
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
    ["Partner review", computed.filter(needsPartnerReview).length]
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

function renderCompactList(id, items) {
  const container = document.querySelector(`#${id}`);
  if (!items.length) {
    container.innerHTML = emptyState("No products yet. Add your first product candidate or load demo samples.");
    return;
  }
  container.innerHTML = items.map((product) => `
    <div class="compact-item">
      <div>
        <strong>${escapeHtml(product.productName)}</strong>
        <div class="meta">${escapeHtml(product.sku)} - ${escapeHtml(product.category)} - ${moneyOrDash(product.costs.suggestedSellingPrice)}</div>
      </div>
      <span class="pill ${normalizeDecision(product.decision)}">${product.score}/100</span>
    </div>
  `).join("");
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderDashboardLists() {
  const computed = products.map(productWithComputed);
  renderCompactList("topProducts", [...computed].sort((a, b) => b.score - a.score).slice(0, 5));
  renderCompactList("partnerReview", computed.filter(needsPartnerReview).sort((a, b) => b.score - a.score).slice(0, 5));
  renderCompactList("websiteReady", computed.filter((product) => product.readyForWebsiteUpload).slice(0, 5));
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
    return true;
  });
}

function renderProductList() {
  const container = document.querySelector("#productList");
  const filtered = getFilteredProducts();

  if (!filtered.length) {
    container.innerHTML = emptyState(products.length
      ? "No products match this filter."
      : "No products yet. Add your first product candidate or load demo samples.");
    return;
  }

  container.innerHTML = filtered.map((product) => `
    <article class="product-card">
      ${isRenderableImage(product.productImageLink)
        ? `<img class="product-image" src="${escapeAttribute(product.productImageLink)}" alt="${escapeAttribute(product.productName)}" />`
        : `<div class="product-image placeholder" aria-hidden="true">A</div>`}
      <div>
        <div class="product-head">
          <div>
            <h3>${escapeHtml(product.productName)}</h3>
            <div class="meta">${escapeHtml(product.sku)} - ${escapeHtml(product.sourcePlatform)} - ${escapeHtml(product.category)}</div>
          </div>
          <div class="status-line">
            <span class="pill ${normalizeDecision(product.decision)}">${product.decision}</span>
            <span class="pill">${product.score}/100</span>
            <span class="pill">${escapeHtml(product.approvalStatus)}</span>
            ${product.readyForWebsiteUpload ? '<span class="pill buy">Website ready</span>' : ""}
          </div>
        </div>
        <div class="product-meta">
          ${product.costs.hasCostData
            ? `<span class="pill">${money(product.costs.suggestedSellingPrice)} selling</span>
              <span class="pill">${money(product.costs.estimatedLandedCost)} landed</span>
              <span class="pill">${percent(product.costs.profitMargin)} margin</span>
              <span class="pill">${money(product.costs.totalPurchaseCost)} purchase</span>`
            : '<span class="pill reject">Incomplete cost data</span>'}
          <span class="pill">MOQ ${toNumber(product.moq)}</span>
          ${product.autoFlag ? `<span class="pill ${product.highRisk ? "reject" : "maybe"}">${escapeHtml(product.autoFlag)}</span>` : ""}
        </div>
        <div class="product-details">
          <div class="detail"><span>Supplier</span><strong>${escapeHtml(product.supplierName || "-")}</strong></div>
          <div class="detail"><span>Sold / Reviews</span><strong>${toNumber(product.soldCount).toLocaleString()} / ${toNumber(product.reviewCount).toLocaleString()}</strong></div>
          <div class="detail"><span>Risk</span><strong>${escapeHtml(product.fragilityLevel)} / ${escapeHtml(product.courierRisk)}</strong></div>
          <div class="detail"><span>QC accepted</span><strong>${product.costs.finalStockAccepted === "" ? "-" : product.costs.finalStockAccepted}</strong></div>
        </div>
        ${product.reason ? `<p class="meta">${escapeHtml(product.reason)}</p>` : ""}
        <div class="card-actions">
          <button class="button secondary" data-action="approve" data-id="${product.id}" type="button">Approve</button>
          <button class="button secondary" data-action="watchlist" data-id="${product.id}" type="button">Watchlist</button>
          <button class="button danger" data-action="reject" data-id="${product.id}" type="button">Reject</button>
          <button class="button secondary" data-action="ordered" data-id="${product.id}" type="button">Mark ordered</button>
          <button class="button secondary" data-action="arrived" data-id="${product.id}" type="button">Mark arrived</button>
          <button class="button secondary" data-action="websiteReady" data-id="${product.id}" type="button">Mark website ready</button>
          <button class="button ghost" data-action="edit" data-id="${product.id}" type="button">Edit</button>
          <button class="button ghost" data-action="delete" data-id="${product.id}" type="button">Delete</button>
          ${product.sourceUrl ? `<a class="button ghost" href="${escapeAttribute(product.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function isRenderableImage(value) {
  return /^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(value || "");
}

function renderAll() {
  products = products.map(normalizeProduct);
  renderStats();
  renderDashboardLists();
  updateFilterOptions();
  renderProductList();
  renderCalculatorPreview();
}

function setProductPatch(id, patch) {
  products = products.map((product) => product.id === id ? normalizeProduct({ ...product, ...patch, updatedAt: new Date().toISOString() }) : product);
  saveProducts();
  renderAll();
}

function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  if (!confirm(`Delete "${product.productName}"?`)) return;
  products = products.filter((item) => item.id !== id);
  saveProducts();
  renderAll();
}

function exportApprovedCsv() {
  const exportRows = products
    .map(productWithComputed)
    .filter((product) => product.approvalStatus === "Approved" && product.readyForWebsiteUpload);

  if (!exportRows.length) {
    alert("No approved website-ready products to export yet.");
    return;
  }

  const headers = [
    "SKU", "Product Name", "Category", "Source Platform", "Source URL", "Image/Link",
    "Suggested Selling Price BDT", "Actual Selling Price BDT", "Final Stock Accepted",
    "Description Ready", "Photos Ready", "Price Approved", "Score", "Decision", "Content/Reel Idea"
  ];

  const rows = exportRows.map((product) => [
    product.sku,
    product.productName,
    product.category,
    product.sourcePlatform,
    product.sourceUrl,
    product.productImageLink,
    product.costs.suggestedSellingPrice.toFixed(2),
    product.actualSellingPrice || "",
    product.costs.finalStockAccepted,
    product.descriptionReady,
    product.photosReady,
    product.priceApproved,
    product.score,
    product.decision,
    product.contentIdea
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aayna-website-upload-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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

form.addEventListener("submit", (event) => {
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

    const existingIndex = products.findIndex((item) => item.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.unshift(product);
    }
    saveProducts();
    resetForm();
    renderAll();
    showMessage("success", `"${product.productName}" was saved successfully.`);
  } catch (error) {
    showMessage("error", `Save failed: ${error.message || "Unknown error"}`);
  }
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settings = {
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
  saveSettings();
  renderAll();
});

document.querySelector("#productList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "approve") setProductPatch(id, { approvalStatus: "Approved", dateDecided: TODAY });
  if (action === "watchlist") setProductPatch(id, { approvalStatus: "On Hold" });
  if (action === "reject") setProductPatch(id, { approvalStatus: "Rejected", dateDecided: TODAY });
  if (action === "ordered") setProductPatch(id, { sourcingStatus: "Ordered" });
  if (action === "arrived") setProductPatch(id, { sourcingStatus: "Arrived", arrivalDate: TODAY, qcStatus: "QC Pending" });
  if (action === "websiteReady") {
    setProductPatch(id, {
      productNameFinalized: "Yes",
      skuFinalized: "Yes",
      photosReady: "Yes",
      descriptionReady: "Yes",
      priceApproved: "Yes",
      sourcingStatus: "Live on Website"
    });
  }
  if (action === "delete") deleteProduct(id);
  if (action === "edit") {
    const product = products.find((item) => item.id === id);
    if (product) {
      setFormProduct(product);
      document.querySelector("#candidate-form").scrollIntoView({ behavior: "smooth" });
    }
  }
});

document.querySelectorAll("#decisionFilter, #categoryFilter, #sourceFilter, #minScoreFilter, #under700Filter, #approvedFilter, #watchlistFilter, #rejectedFilter, #websiteReadyFilter")
  .forEach((input) => input.addEventListener("input", renderProductList));

document.querySelector("#resetFormBtn").addEventListener("click", resetForm);
document.querySelector("#cancelEditBtn").addEventListener("click", resetForm);
document.querySelector("#exportCsvBtn").addEventListener("click", exportApprovedCsv);
document.querySelector("#seedDataBtn").addEventListener("click", () => {
  hideMessage();
  const stampedSamples = SAMPLE_PRODUCTS.map((product, index) => normalizeProduct({
    ...product,
    id: crypto.randomUUID(),
    sku: generateSku(product, index),
    updatedAt: new Date().toISOString()
  }));
  products = [...stampedSamples, ...products];
  saveProducts();
  renderAll();
  showMessage("success", "Loaded 5 demo products covering Buy, Maybe, Price Review, Reject by price, and Reject by quality/aesthetic.");
});

initializeDropdowns();
renderScoreInputs();
renderSettings();
resetForm();
renderAll();
