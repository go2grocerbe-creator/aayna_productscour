/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_TASK_BATCH_SIZE = 5;
const DEFAULT_MAX_RESULTS = 10;
const REQUEST_DELAY_MS = 1200;
const FETCH_TIMEOUT_MS = 15000;
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid"
]);
const CATEGORY_PREFIX = {
  Earrings: "EAR",
  Necklace: "NEC",
  Bracelet: "BRC",
  Ring: "RNG",
  "Hair Accessory": "HAR",
  Bag: "BAG",
  Other: "OTH"
};
const DEFAULT_MISSING_FIELDS = [
  "unitCost",
  "supplierName",
  "productImageLink",
  "productRating",
  "reviewCount",
  "soldCount",
  "competitorPrice"
];

loadEnvFile(path.join(ROOT_DIR, ".env.worker"));
loadEnvFile(path.join(ROOT_DIR, ".env.worker.local"));
loadEnvFile(path.join(ROOT_DIR, ".env.discovery"));
loadEnvFile(path.join(ROOT_DIR, ".env.discovery.local"));

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run") || process.env.DISCOVERY_DRY_RUN === "true";
const limitArg = readArgNumber("--limit") || readArgNumber("--task-limit");
const taskBatchSize = limitArg || Number(process.env.DISCOVERY_BATCH_SIZE || DEFAULT_TASK_BATCH_SIZE);
const maxResultsArg = readArgNumber("--max-results");
const maxResultsPerTask = maxResultsArg || Number(process.env.DISCOVERY_MAX_RESULTS_PER_TASK || DEFAULT_MAX_RESULTS);

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUYOS_WORKSPACE_ID = process.env.BUYOS_WORKSPACE_ID || "";
const DISCOVERY_PROVIDER = normalizeKey(process.env.DISCOVERY_PROVIDER || "");
const DISCOVERY_API_KEY = process.env.DISCOVERY_API_KEY || "";
const ALLOWED_DOMAINS = splitCsv(process.env.DISCOVERY_ALLOWED_DOMAINS || "").map((domain) => domain.toLowerCase());

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BUYOS_WORKSPACE_ID) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or BUYOS_WORKSPACE_ID.");
  process.exit(1);
}

if (!DISCOVERY_PROVIDER) {
  console.error("Missing DISCOVERY_PROVIDER. Set it in .env.discovery.local, for example brave, serpapi, or tavily.");
  process.exit(1);
}

if (!DISCOVERY_API_KEY) {
  console.error("Missing DISCOVERY_API_KEY. Add your local search provider API key to .env.discovery.local.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

main().catch((error) => {
  console.error("Source Discovery worker failed:", safeError(error));
  process.exit(1);
});

async function main() {
  const provider = getProvider(DISCOVERY_PROVIDER);
  console.info("Source Discovery worker started", {
    workspaceId: BUYOS_WORKSPACE_ID,
    provider: provider.name,
    dryRun: DRY_RUN,
    taskBatchSize,
    maxResultsPerTask,
    allowedDomainCount: ALLOWED_DOMAINS.length
  });

  const settingsRow = await loadSettings();
  const settings = settingsRow.data;
  const tasks = normalizeTasks(settings.sourceScoutTasks);
  const pendingTasks = tasks.filter((task) => task.status === "pending").slice(0, taskBatchSize);
  if (!pendingTasks.length) {
    console.info("No pending Source Scout search tasks found.");
    return;
  }

  const existingProducts = await loadProducts();
  const createdProducts = [];
  const now = new Date().toISOString();

  for (const task of pendingTasks) {
    console.info("Running discovery task", {
      taskId: task.id,
      keyword: task.keyword,
      category: task.category
    });
    try {
      const results = await provider.search(task.keyword, maxResultsPerTask);
      const candidates = filterDiscoveryResults(results, task, [...existingProducts, ...createdProducts])
        .slice(0, maxResultsPerTask);
      const taskStats = {
        discovered: results.length,
        imported: 0,
        skipped: Math.max(0, results.length - candidates.length),
        failed: 0
      };

      for (const candidate of candidates) {
        const product = createDiscoveredProduct(candidate, task, provider.name, [...existingProducts, ...createdProducts]);
        if (DRY_RUN) {
          console.info("Dry run candidate", {
            taskId: task.id,
            sourceHost: safeHost(product.sourceUrl),
            title: product.productName,
            sku: product.sku
          });
          createdProducts.push(product);
          continue;
        }
        const saved = await insertProduct(product);
        createdProducts.push(saved);
        taskStats.imported += 1;
      }

      applyTaskStats(task, taskStats, now, "");
    } catch (error) {
      applyTaskStats(task, { discovered: 0, imported: 0, skipped: 0, failed: 1 }, now, safeErrorMessage(error));
      console.warn("Discovery task failed", {
        taskId: task.id,
        message: safeErrorMessage(error)
      });
    }
    await delay(REQUEST_DELAY_MS);
  }

  if (!DRY_RUN) {
    await saveSettings({
      ...settings,
      sourceScoutTasks: tasks
    });
  } else {
    console.info("Dry run: skipped product inserts and settings updates.");
  }

  console.info("Source Discovery worker finished", {
    imported: createdProducts.length,
    dryRun: DRY_RUN
  });
}

function getProvider(providerName) {
  if (providerName === "brave") return { name: "brave", search: searchBrave };
  if (providerName === "serpapi") return { name: "serpapi", search: searchSerpApi };
  if (providerName === "tavily") return { name: "tavily", search: searchTavily };
  throw new Error(`Unsupported DISCOVERY_PROVIDER "${providerName}". Supported providers: brave, serpapi, tavily.`);
}

async function searchBrave(query, limit) {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(Math.max(limit, 1), 20)));
  const json = await fetchJson(url.toString(), {
    headers: {
      "x-subscription-token": DISCOVERY_API_KEY,
      accept: "application/json"
    }
  });
  return (json.web?.results || []).map((item, index) => ({
    url: item.url,
    title: item.title,
    rank: index + 1
  }));
}

async function searchSerpApi(query, limit) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(Math.min(Math.max(limit, 1), 20)));
  url.searchParams.set("api_key", DISCOVERY_API_KEY);
  const json = await fetchJson(url.toString());
  return (json.organic_results || []).map((item, index) => ({
    url: item.link,
    title: item.title,
    rank: item.position || index + 1
  }));
}

async function searchTavily(query, limit) {
  const json = await fetchJson("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      api_key: DISCOVERY_API_KEY,
      query,
      max_results: Math.min(Math.max(limit, 1), 20),
      search_depth: "basic"
    })
  });
  return (json.results || []).map((item, index) => ({
    url: item.url,
    title: item.title,
    rank: index + 1
  }));
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Search provider returned HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function filterDiscoveryResults(results, task, knownProducts) {
  const knownKeys = new Set(knownProducts.flatMap(productIdentityKeys));
  const batchKeys = new Set();
  const candidates = [];
  for (const result of results) {
    const sourceUrl = canonicalUrl(result.url);
    if (!sourceUrl || !domainAllowed(sourceUrl)) continue;
    const productName = cleanTitle(result.title) || inferProductNameFromUrl(sourceUrl) || "Discovered candidate";
    const candidate = {
      sourceUrl,
      productName,
      category: task.category,
      slug: slugify(`${productName}-${safeHost(sourceUrl)}`),
      sourceScoutKeyword: task.keyword
    };
    const keys = productIdentityKeys(candidate);
    if (keys.some((key) => knownKeys.has(key) || batchKeys.has(key))) continue;
    keys.forEach((key) => batchKeys.add(key));
    candidates.push({ ...candidate, title: result.title || productName, rank: result.rank || candidates.length + 1 });
  }
  return candidates;
}

function createDiscoveredProduct(candidate, task, providerName, existingProducts) {
  const now = new Date().toISOString();
  const sourcePlatform = inferSourcePlatform(candidate.sourceUrl, task.sourcePlatform);
  const productName = candidate.productName || "Discovered candidate";
  const product = {
    id: crypto.randomUUID(),
    dateAdded: now.slice(0, 10),
    productName,
    slug: candidate.slug,
    sku: generateScoutSku(task.category, existingProducts),
    provisionalSku: true,
    skuFinalized: "No",
    sourcePlatform,
    sourceUrl: candidate.sourceUrl,
    category: task.category || "Other",
    unitCost: "",
    sourceCurrency: "BDT",
    shippingCostBdt: 0,
    moq: 1,
    approvalStatus: "Pending",
    sourcingStatus: "Imported - Needs Review",
    launchStatus: "",
    importStatus: "needs_review",
    needsHumanReview: true,
    importedBy: "source_discovery_worker",
    discoveredBy: "source_discovery_worker",
    discoveredAt: now,
    sourceScoutTaskId: task.id,
    sourceScoutKeyword: task.keyword,
    sourceDiscoveryProvider: providerName,
    sourceDiscoveryRank: candidate.rank,
    metadataStatus: "pending",
    reason: "Discovered from Source Scout search task. Needs manual cost, supplier, rating, and score review.",
    contentIdea: contentIdea(productName, task.category, task.keyword),
    manualScoreAdjusted: "No",
    scores: defaultScores(),
    draftScores: draftScores(productName, task.category, task.keyword),
    draftScoreReason: "Initial discovery score based on keyword/title only. Metadata and human review required.",
    draftScoreConfidence: "low",
    draftScoreSource: "source_discovery_worker",
    needsScoreReview: true,
    missingFields: DEFAULT_MISSING_FIELDS,
    draftMissingFields: DEFAULT_MISSING_FIELDS,
    updatedAt: now
  };
  return product;
}

async function insertProduct(product) {
  const { data, error } = await supabase
    .from("buyos_products")
    .insert({
      workspace_id: BUYOS_WORKSPACE_ID,
      legacy_id: product.id,
      sku: product.sku,
      slug: product.slug,
      data: product
    })
    .select("id")
    .single();
  if (error) throw error;
  return { ...product, dbId: data.id };
}

async function loadSettings() {
  const { data, error } = await supabase
    .from("buyos_settings")
    .select("workspace_id, data")
    .eq("workspace_id", BUYOS_WORKSPACE_ID)
    .maybeSingle();
  if (error) throw error;
  return { data: data?.data || {} };
}

async function saveSettings(settings) {
  const { error } = await supabase
    .from("buyos_settings")
    .upsert({
      workspace_id: BUYOS_WORKSPACE_ID,
      data: settings
    }, { onConflict: "workspace_id" });
  if (error) throw error;
}

async function loadProducts() {
  const { data, error } = await supabase
    .from("buyos_products")
    .select("id, legacy_id, sku, slug, data")
    .eq("workspace_id", BUYOS_WORKSPACE_ID);
  if (error) throw error;
  return (data || []).map((row) => ({
    ...(row.data || {}),
    dbId: row.id,
    id: row.data?.id || row.legacy_id || row.id,
    sku: row.data?.sku || row.sku || "",
    slug: row.data?.slug || row.slug || ""
  }));
}

function normalizeTasks(tasks) {
  return (Array.isArray(tasks) ? tasks : []).map((task) => ({
    id: task.id || crypto.randomUUID(),
    keyword: task.keyword || "",
    category: task.category || "Other",
    sourcePlatform: task.sourcePlatform || "Other",
    maxTargetSellingPrice: task.maxTargetSellingPrice ?? task.maxTargetPrice ?? "",
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

function applyTaskStats(task, stats, now, error) {
  task.discoveredCount += stats.discovered;
  task.importedCount += stats.imported;
  task.skippedDuplicateCount += stats.skipped;
  task.failedCount += stats.failed;
  task.lastRunAt = now;
  task.updatedAt = now;
  task.lastError = error || "";
  if (error) task.status = "pending";
}

function generateScoutSku(category, existingProducts) {
  const prefix = CATEGORY_PREFIX[category] || "OTH";
  const pattern = new RegExp(`^SCOUT-${prefix}-(\\d{4})$`, "i");
  const used = new Set();
  existingProducts.forEach((product) => {
    [product.sku, product.enteredSku, product.data?.sku].forEach((sku) => {
      const match = String(sku || "").trim().match(pattern);
      if (match) used.add(Number(match[1]));
    });
  });
  let next = 1;
  while (used.has(next)) next += 1;
  return `SCOUT-${prefix}-${String(next).padStart(4, "0")}`;
}

function productIdentityKeys(product) {
  return [
    product.sourceUrl ? `source:${canonicalUrl(product.sourceUrl)}` : "",
    product.sku ? `sku:${normalizeKey(product.sku)}` : "",
    product.slug ? `slug:${normalizeKey(product.slug)}` : "",
    product.productName ? `namecat:${normalizeKey(product.productName)}:${normalizeKey(product.category)}` : "",
    product.sourceScoutKeyword && product.sourceUrl ? `keywordurl:${normalizeKey(product.sourceScoutKeyword)}:${canonicalUrl(product.sourceUrl)}` : ""
  ].filter(Boolean);
}

function canonicalUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.hash = "";
    [...url.searchParams.keys()].forEach((key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
    });
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

function domainAllowed(sourceUrl) {
  if (!ALLOWED_DOMAINS.length) return true;
  const host = safeHost(sourceUrl).toLowerCase().replace(/^www\./, "");
  return ALLOWED_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function inferSourcePlatform(sourceUrl, taskPlatform) {
  if (taskPlatform && taskPlatform !== "Other") return taskPlatform;
  const host = safeHost(sourceUrl).toLowerCase();
  if (host === "aliexpress.com" || host === "www.aliexpress.com" || host.endsWith(".aliexpress.com")) return "AliExpress";
  if (host === "1688.com" || host.endsWith(".1688.com")) return "1688";
  if (host === "yiwugo.com" || host.endsWith(".yiwugo.com")) return "Yiwugo";
  if (host === "daraz.com.bd" || host.endsWith(".daraz.com.bd")) return "Daraz Bangladesh";
  return "Other";
}

function inferProductNameFromUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const raw = [...parts].reverse().find((part) => !/^\d+$/.test(part) && !/^item$/i.test(part)) || url.hostname;
    return titleCase(decodeURIComponent(raw)
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_+]+/g, " ")
      .replace(/\b(item|product|detail|html)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim());
  } catch {
    return "";
  }
}

function draftScores(productName, category, keyword) {
  const title = `${productName} ${category} ${keyword}`.toLowerCase();
  return {
    feminine: /pearl|gold|rose|heart|bow|flower|charm|cute/.test(title) ? 4 : 3,
    trendy: /korean|minimal|hoop|clip|choker|layer|viral|pearl/.test(title) ? 4 : 3,
    aaynaFit: category && category !== "Other" ? 4 : 3,
    easyToStyle: /earring|necklace|bracelet|ring|hair|bag|scarf/.test(title) ? 4 : 3,
    lightweight: ["Earrings", "Ring", "Hair Accessory", "Bracelet", "Necklace"].includes(category) ? 4 : 3,
    reelsPhotos: 3,
    giftability: ["Earrings", "Necklace", "Bracelet", "Ring", "Gift Set"].includes(category) ? 4 : 3,
    priceFit: 2,
    demand: 3,
    qualityRisk: 3
  };
}

function defaultScores() {
  return {
    feminine: 3,
    trendy: 3,
    aaynaFit: 3,
    easyToStyle: 3,
    lightweight: 3,
    reelsPhotos: 3,
    giftability: 3,
    priceFit: 3,
    demand: 3,
    qualityRisk: 3
  };
}

function contentIdea(productName, category, keyword) {
  return `Style ${productName || category || "this accessory"} in a short reel for ${keyword || "AAYNA customers"}.`;
}

function cleanTitle(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function safeHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "unknown";
  }
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, ""))
    .filter(Boolean);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function readArgNumber(name) {
  const arg = args.find((item) => item.startsWith(`${name}=`));
  if (!arg) return 0;
  const number = Number(arg.split("=")[1]);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function safeError(error) {
  return { message: error?.message || "Unknown error", code: error?.code || "" };
}

function safeErrorMessage(error) {
  return String(error?.message || "Unknown error").slice(0, 240);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...rest] = trimmed.split("=");
    if (!key || process.env[key]) return;
    process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
  });
}
