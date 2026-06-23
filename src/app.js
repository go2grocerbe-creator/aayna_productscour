const DEFAULT_SETTINGS = {
  usdRate: 118,
  rmbRate: 16.3,
  markupPercentage: 65,
  targetMaxPrice: 700,
  hardRejectPrice: 1000,
  monthlyBudget: 30000
};

const SCORE_FIELDS = [
  ["feminine", "Feminine"],
  ["trendy", "Trendy"],
  ["aaynaFit", "AAYNA aesthetic fit"],
  ["easyToStyle", "Easy to style"],
  ["lightweight", "Lightweight"],
  ["reelsPhotos", "Good for reels/photos"],
  ["giftability", "Giftability"],
  ["priceFit", "Price fit"],
  ["demand", "Demand"],
  ["qualityRisk", "Quality/risk"]
];

const SAMPLE_PRODUCTS = [
  {
    productName: "Pearl bow hair claw",
    sourcePlatform: "AliExpress",
    sourceUrl: "https://example.com/pearl-bow-hair-claw",
    imageUrl: "",
    category: "Hair accessories",
    supplierPrice: 1.85,
    currency: "USD",
    shippingCost: 35,
    moq: 12,
    supplierRating: 4.8,
    productRating: 4.7,
    soldCount: 1800,
    material: "Acrylic, faux pearl",
    color: "Ivory and gold",
    weightSize: "22g / 9 cm",
    notes: "Strong AAYNA fit. Good for Eid reels and gift bundles.",
    scores: {
      feminine: 10,
      trendy: 9,
      aaynaFit: 9,
      easyToStyle: 9,
      lightweight: 8,
      reelsPhotos: 9,
      giftability: 8,
      priceFit: 8,
      demand: 8,
      qualityRisk: 7
    },
    status: "Watchlist"
  },
  {
    productName: "Minimal gold hoop set",
    sourcePlatform: "SkyBuyBD",
    sourceUrl: "https://example.com/gold-hoop-set",
    imageUrl: "",
    category: "Jewelry",
    supplierPrice: 245,
    currency: "BDT",
    shippingCost: 30,
    moq: 10,
    supplierRating: 4.5,
    productRating: 4.6,
    soldCount: 650,
    material: "Alloy",
    color: "Gold",
    weightSize: "18g",
    notes: "Simple styling product, likely easy website upload.",
    scores: {
      feminine: 8,
      trendy: 7,
      aaynaFit: 8,
      easyToStyle: 10,
      lightweight: 9,
      reelsPhotos: 7,
      giftability: 8,
      priceFit: 9,
      demand: 7,
      qualityRisk: 6
    },
    status: "Approved"
  }
];

let products = loadProducts();
let settings = loadSettings();

const form = document.querySelector("#productForm");
const settingsForm = document.querySelector("#settingsForm");
const scoreInputs = document.querySelector("#scoreInputs");
const calculatorPreview = document.querySelector("#calculatorPreview");
const emptyStateTemplate = document.querySelector("#emptyStateTemplate");

function loadProducts() {
  return JSON.parse(localStorage.getItem("aaynaProducts") || "[]");
}

function saveProducts() {
  localStorage.setItem("aaynaProducts", JSON.stringify(products));
}

function loadSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...JSON.parse(localStorage.getItem("aaynaSettings") || "{}")
  };
}

function saveSettings() {
  localStorage.setItem("aaynaSettings", JSON.stringify(settings));
}

function money(value) {
  return `BDT ${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

function numberValue(id, fallback = 0) {
  const value = document.querySelector(`#${id}`).value;
  return value === "" ? fallback : Number(value);
}

function normalizeDecision(decision) {
  return decision.toLowerCase().replace(/\s+/g, "-");
}

function currencyRate(currency) {
  if (currency === "USD") return settings.usdRate;
  if (currency === "RMB") return settings.rmbRate;
  return 1;
}

function calculateCosts(product) {
  const supplierPriceBdt = Number(product.supplierPrice || 0) * currencyRate(product.currency);
  const shippingBdt = Number(product.shippingCost || 0) * currencyRate(product.currency);
  const landedCost = supplierPriceBdt + shippingBdt;
  const suggestedSellingPrice = landedCost * (1 + Number(settings.markupPercentage || 0) / 100);
  const expectedProfit = suggestedSellingPrice - landedCost;
  const profitMargin = suggestedSellingPrice > 0 ? (expectedProfit / suggestedSellingPrice) * 100 : 0;

  return {
    supplierPriceBdt,
    shippingBdt,
    landedCost,
    suggestedSellingPrice,
    expectedProfit,
    profitMargin
  };
}

function calculateScore(product) {
  const total = SCORE_FIELDS.reduce((sum, [key]) => sum + Number(product.scores?.[key] || 0), 0);
  return Math.max(0, Math.min(100, total));
}

function calculateDecision(product) {
  const score = calculateScore(product);
  const costs = calculateCosts(product);
  const aesthetic = Number(product.scores?.aaynaFit || 0);
  const qualityRisk = Number(product.scores?.qualityRisk || 0);

  if (costs.suggestedSellingPrice > settings.hardRejectPrice) return "Reject";
  if (costs.suggestedSellingPrice > settings.targetMaxPrice) return "Price Review";

  let decision = "Reject";
  if (score >= 80) decision = "Buy";
  if (score >= 65 && score < 80) decision = "Maybe";
  if ((qualityRisk <= 2 || aesthetic <= 2) && decision === "Buy") decision = "Maybe";

  return decision;
}

function purchaseCost(product) {
  const costs = calculateCosts(product);
  return costs.landedCost * Math.max(1, Number(product.moq || 1));
}

function productWithComputed(product) {
  const costs = calculateCosts(product);
  const score = calculateScore(product);
  const decision = calculateDecision(product);
  return { ...product, costs, score, decision };
}

function renderScoreInputs() {
  scoreInputs.innerHTML = SCORE_FIELDS.map(([key, label]) => `
    <label>
      ${label}
      <input id="score-${key}" type="number" min="0" max="10" step="1" value="5" />
    </label>
  `).join("");
}

function getFormProduct() {
  const scores = {};
  SCORE_FIELDS.forEach(([key]) => {
    scores[key] = Number(document.querySelector(`#score-${key}`).value || 0);
  });

  return {
    id: document.querySelector("#productId").value || crypto.randomUUID(),
    productName: document.querySelector("#productName").value.trim(),
    sourcePlatform: document.querySelector("#sourcePlatform").value.trim(),
    sourceUrl: document.querySelector("#sourceUrl").value.trim(),
    imageUrl: document.querySelector("#imageUrl").value.trim(),
    category: document.querySelector("#category").value.trim(),
    supplierPrice: numberValue("supplierPrice"),
    currency: document.querySelector("#currency").value,
    shippingCost: numberValue("shippingCost"),
    moq: numberValue("moq", 1),
    supplierRating: numberValue("supplierRating"),
    productRating: numberValue("productRating"),
    soldCount: numberValue("soldCount"),
    material: document.querySelector("#material").value.trim(),
    color: document.querySelector("#color").value.trim(),
    weightSize: document.querySelector("#weightSize").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
    scores,
    status: document.querySelector("#productId").value
      ? products.find((product) => product.id === document.querySelector("#productId").value)?.status || "New"
      : "New",
    updatedAt: new Date().toISOString()
  };
}

function setFormProduct(product) {
  document.querySelector("#productId").value = product.id || "";
  document.querySelector("#productName").value = product.productName || "";
  document.querySelector("#sourcePlatform").value = product.sourcePlatform || "";
  document.querySelector("#sourceUrl").value = product.sourceUrl || "";
  document.querySelector("#imageUrl").value = product.imageUrl || "";
  document.querySelector("#category").value = product.category || "";
  document.querySelector("#supplierPrice").value = product.supplierPrice || "";
  document.querySelector("#currency").value = product.currency || "BDT";
  document.querySelector("#shippingCost").value = product.shippingCost || 0;
  document.querySelector("#moq").value = product.moq || 1;
  document.querySelector("#supplierRating").value = product.supplierRating || "";
  document.querySelector("#productRating").value = product.productRating || "";
  document.querySelector("#soldCount").value = product.soldCount || "";
  document.querySelector("#material").value = product.material || "";
  document.querySelector("#color").value = product.color || "";
  document.querySelector("#weightSize").value = product.weightSize || "";
  document.querySelector("#notes").value = product.notes || "";
  SCORE_FIELDS.forEach(([key]) => {
    document.querySelector(`#score-${key}`).value = product.scores?.[key] ?? 5;
  });
  document.querySelector("#formTitle").textContent = product.id ? "Edit Product Candidate" : "Add Product Candidate";
  document.querySelector("#cancelEditBtn").classList.toggle("hidden", !product.id);
  renderCalculatorPreview();
}

function resetForm() {
  form.reset();
  document.querySelector("#productId").value = "";
  document.querySelector("#currency").value = "BDT";
  document.querySelector("#shippingCost").value = 0;
  document.querySelector("#moq").value = 1;
  SCORE_FIELDS.forEach(([key]) => {
    document.querySelector(`#score-${key}`).value = 5;
  });
  document.querySelector("#formTitle").textContent = "Add Product Candidate";
  document.querySelector("#cancelEditBtn").classList.add("hidden");
  renderCalculatorPreview();
}

function renderCalculatorPreview() {
  const product = getFormProduct();
  const computed = productWithComputed(product);
  calculatorPreview.innerHTML = [
    ["Supplier BDT", money(computed.costs.supplierPriceBdt)],
    ["Landed cost", money(computed.costs.landedCost)],
    ["Selling price", money(computed.costs.suggestedSellingPrice)],
    ["Expected profit", money(computed.costs.expectedProfit)],
    ["Margin", `${computed.costs.profitMargin.toFixed(1)}%`],
    ["Score", `${computed.score}/100`],
    ["Decision", computed.decision]
  ].map(([label, value]) => `
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
  const buy = computed.filter((product) => product.decision === "Buy").length;
  const maybe = computed.filter((product) => product.decision === "Maybe").length;
  const priceReview = computed.filter((product) => product.decision === "Price Review").length;
  const reject = computed.filter((product) => product.decision === "Reject").length;
  const approvedCost = computed
    .filter((product) => product.status === "Approved")
    .reduce((sum, product) => sum + purchaseCost(product), 0);
  const remaining = Math.max(0, settings.monthlyBudget - approvedCost);
  const used = settings.monthlyBudget > 0 ? (approvedCost / settings.monthlyBudget) * 100 : 0;

  const cards = [
    ["Total products", computed.length],
    ["Buy count", buy],
    ["Maybe count", maybe],
    ["Price Review", priceReview],
    ["Reject count", reject],
    ["Approved cost", money(approvedCost)],
    ["Remaining budget", money(remaining)],
    ["Budget used", `${used.toFixed(1)}%`]
  ];

  document.querySelector("#statsGrid").innerHTML = cards.map(([label, value]) => `
    <div class="stat-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `).join("");
}

function renderCompactList(id, items) {
  const container = document.querySelector(`#${id}`);
  if (!items.length) {
    container.innerHTML = emptyStateTemplate.innerHTML;
    return;
  }

  container.innerHTML = items.map((product) => `
    <div class="compact-item">
      <div>
        <strong>${escapeHtml(product.productName)}</strong>
        <div class="meta">${escapeHtml(product.category)} · ${money(product.costs.suggestedSellingPrice)}</div>
      </div>
      <span class="pill ${normalizeDecision(product.decision)}">${product.score}/100</span>
    </div>
  `).join("");
}

function renderDashboardLists() {
  const computed = products.map(productWithComputed);
  renderCompactList("topProducts", computed.sort((a, b) => b.score - a.score).slice(0, 5));
  renderCompactList(
    "partnerReview",
    computed.filter((product) => product.decision === "Price Review" || product.decision === "Maybe" || product.status === "Watchlist").slice(0, 5)
  );
  renderCompactList(
    "websiteReady",
    computed.filter((product) => product.status === "Approved" && product.imageUrl && product.decision !== "Reject").slice(0, 5)
  );
}

function updateFilterOptions() {
  const selectedCategory = document.querySelector("#categoryFilter").value;
  const selectedSource = document.querySelector("#sourceFilter").value;
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  const sources = [...new Set(products.map((product) => product.sourcePlatform).filter(Boolean))].sort();
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

  return products.map(productWithComputed).filter((product) => {
    if (decision && product.decision !== decision) return false;
    if (category && product.category !== category) return false;
    if (source && product.sourcePlatform !== source) return false;
    if (product.score < minScore) return false;
    if (under700 && product.costs.suggestedSellingPrice > 700) return false;
    if (approved && product.status !== "Approved") return false;
    if (watchlist && product.status !== "Watchlist") return false;
    if (rejected && product.status !== "Rejected") return false;
    return true;
  });
}

function renderProductList() {
  const container = document.querySelector("#productList");
  const filtered = getFilteredProducts();

  if (!filtered.length) {
    container.innerHTML = emptyStateTemplate.innerHTML;
    return;
  }

  container.innerHTML = filtered.map((product) => `
    <article class="product-card">
      ${product.imageUrl
        ? `<img class="product-image" src="${escapeAttribute(product.imageUrl)}" alt="${escapeAttribute(product.productName)}" />`
        : `<div class="product-image placeholder" aria-hidden="true">A</div>`}
      <div>
        <div class="product-head">
          <div>
            <h3>${escapeHtml(product.productName)}</h3>
            <div class="meta">${escapeHtml(product.sourcePlatform)} · ${escapeHtml(product.category)}</div>
          </div>
          <div class="status-line">
            <span class="pill ${normalizeDecision(product.decision)}">${product.decision}</span>
            <span class="pill">${product.score}/100</span>
            <span class="pill">${escapeHtml(product.status || "New")}</span>
          </div>
        </div>
        <div class="product-meta">
          <span class="pill">${money(product.costs.suggestedSellingPrice)} selling</span>
          <span class="pill">${money(product.costs.landedCost)} landed</span>
          <span class="pill">${product.costs.profitMargin.toFixed(1)}% margin</span>
          <span class="pill">MOQ ${Number(product.moq || 1)}</span>
        </div>
        <div class="product-details">
          <div class="detail"><span>Supplier</span><strong>${money(product.costs.supplierPriceBdt)}</strong></div>
          <div class="detail"><span>Sold</span><strong>${Number(product.soldCount || 0).toLocaleString()}</strong></div>
          <div class="detail"><span>Material</span><strong>${escapeHtml(product.material || "-")}</strong></div>
          <div class="detail"><span>Color</span><strong>${escapeHtml(product.color || "-")}</strong></div>
        </div>
        ${product.notes ? `<p class="meta">${escapeHtml(product.notes)}</p>` : ""}
        <div class="card-actions">
          <button class="button secondary" data-action="approve" data-id="${product.id}" type="button">Approve</button>
          <button class="button secondary" data-action="watchlist" data-id="${product.id}" type="button">Watchlist</button>
          <button class="button danger" data-action="reject" data-id="${product.id}" type="button">Reject</button>
          <button class="button ghost" data-action="edit" data-id="${product.id}" type="button">Edit</button>
          <button class="button ghost" data-action="delete" data-id="${product.id}" type="button">Delete</button>
          ${product.sourceUrl ? `<a class="button ghost" href="${escapeAttribute(product.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
        </div>
      </div>
    </article>
  `).join("");
}

function renderAll() {
  renderStats();
  renderDashboardLists();
  updateFilterOptions();
  renderProductList();
  renderCalculatorPreview();
}

function setStatus(id, status) {
  products = products.map((product) => product.id === id ? { ...product, status, updatedAt: new Date().toISOString() } : product);
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
  const approved = products.map(productWithComputed).filter((product) => product.status === "Approved");
  if (!approved.length) {
    alert("No approved products to export yet.");
    return;
  }

  const headers = [
    "Product name",
    "Source platform",
    "Source URL",
    "Image URL",
    "Category",
    "Supplier price BDT",
    "Landed cost BDT",
    "Suggested selling price BDT",
    "Expected profit BDT",
    "Profit margin %",
    "MOQ",
    "Score",
    "Decision",
    "Material",
    "Color",
    "Weight/size",
    "Notes"
  ];

  const rows = approved.map((product) => [
    product.productName,
    product.sourcePlatform,
    product.sourceUrl,
    product.imageUrl,
    product.category,
    product.costs.supplierPriceBdt.toFixed(2),
    product.costs.landedCost.toFixed(2),
    product.costs.suggestedSellingPrice.toFixed(2),
    product.costs.expectedProfit.toFixed(2),
    product.costs.profitMargin.toFixed(2),
    product.moq,
    product.score,
    product.decision,
    product.material,
    product.color,
    product.weightSize,
    product.notes
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aayna-approved-products-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
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
  const product = getFormProduct();
  const existingIndex = products.findIndex((item) => item.id === product.id);
  if (existingIndex >= 0) {
    products[existingIndex] = product;
  } else {
    products.unshift(product);
  }
  saveProducts();
  resetForm();
  renderAll();
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  settings = {
    usdRate: numberValue("usdRate", DEFAULT_SETTINGS.usdRate),
    rmbRate: numberValue("rmbRate", DEFAULT_SETTINGS.rmbRate),
    markupPercentage: numberValue("markupPercentage", DEFAULT_SETTINGS.markupPercentage),
    targetMaxPrice: numberValue("targetMaxPrice", DEFAULT_SETTINGS.targetMaxPrice),
    hardRejectPrice: numberValue("hardRejectPrice", DEFAULT_SETTINGS.hardRejectPrice),
    monthlyBudget: numberValue("monthlyBudget", DEFAULT_SETTINGS.monthlyBudget)
  };
  saveSettings();
  renderAll();
});

document.querySelector("#productList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "approve") setStatus(id, "Approved");
  if (action === "watchlist") setStatus(id, "Watchlist");
  if (action === "reject") setStatus(id, "Rejected");
  if (action === "delete") deleteProduct(id);
  if (action === "edit") {
    const product = products.find((item) => item.id === id);
    if (product) {
      setFormProduct(product);
      document.querySelector("#candidate-form").scrollIntoView({ behavior: "smooth" });
    }
  }
});

document.querySelectorAll("#decisionFilter, #categoryFilter, #sourceFilter, #minScoreFilter, #under700Filter, #approvedFilter, #watchlistFilter, #rejectedFilter")
  .forEach((input) => input.addEventListener("input", renderProductList));

document.querySelector("#resetFormBtn").addEventListener("click", resetForm);
document.querySelector("#cancelEditBtn").addEventListener("click", resetForm);
document.querySelector("#exportCsvBtn").addEventListener("click", exportApprovedCsv);
document.querySelector("#seedDataBtn").addEventListener("click", () => {
  const stampedSamples = SAMPLE_PRODUCTS.map((product) => ({
    ...product,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString()
  }));
  products = [...stampedSamples, ...products];
  saveProducts();
  renderAll();
});

renderScoreInputs();
renderSettings();
resetForm();
renderAll();
