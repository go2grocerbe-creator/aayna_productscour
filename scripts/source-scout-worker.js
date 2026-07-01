/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_BATCH_SIZE = 10;
const FETCH_TIMEOUT_MS = 10000;
const REQUEST_DELAY_MS = 1200;

loadEnvFile(path.join(ROOT_DIR, ".env.worker"));
loadEnvFile(path.join(ROOT_DIR, ".env.worker.local"));

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run") || process.env.SOURCE_SCOUT_DRY_RUN === "true";
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const BATCH_SIZE = Number(limitArg?.split("=")[1] || process.env.SOURCE_SCOUT_BATCH_SIZE || DEFAULT_BATCH_SIZE);

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUYOS_WORKSPACE_ID = process.env.BUYOS_WORKSPACE_ID || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BUYOS_WORKSPACE_ID) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or BUYOS_WORKSPACE_ID.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

main().catch((error) => {
  console.error("Source Scout worker failed:", safeError(error));
  process.exit(1);
});

async function main() {
  console.info("Source Scout worker started", {
    workspaceId: BUYOS_WORKSPACE_ID,
    dryRun: DRY_RUN,
    batchSize: BATCH_SIZE
  });

  const rows = await loadScoutRows();
  console.info("Source Scout rows loaded", { count: rows.length });

  let complete = 0;
  let partial = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await processRow(row);
    if (result === "complete") complete += 1;
    else if (result === "partial") partial += 1;
    else failed += 1;
    await delay(REQUEST_DELAY_MS);
  }

  console.info("Source Scout worker finished", { complete, partial, failed });
}

async function loadScoutRows() {
  let query = supabase
    .from("buyos_products")
    .select("id, workspace_id, legacy_id, sku, slug, data, updated_at")
    .eq("workspace_id", BUYOS_WORKSPACE_ID)
    .in("data->>importedBy", ["source_scout", "source_discovery_worker"])
    .not("data->>sourceUrl", "is", null)
    .or("data->>metadataStatus.is.null,data->>metadataStatus.neq.complete")
    .order("updated_at", { ascending: true })
    .limit(Math.max(BATCH_SIZE, 10));

  let { data, error } = await query;

  if (error) {
    console.warn("Strict metadata-status filter failed; retrying with client-side filtering.", safeError(error));
    const fallback = await supabase
      .from("buyos_products")
      .select("id, workspace_id, legacy_id, sku, slug, data, updated_at")
      .eq("workspace_id", BUYOS_WORKSPACE_ID)
      .in("data->>importedBy", ["source_scout", "source_discovery_worker"])
      .not("data->>sourceUrl", "is", null)
      .order("updated_at", { ascending: true })
      .limit(Math.max(BATCH_SIZE * 5, 25));
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;

  return (data || [])
    .filter((row) => row?.data?.sourceUrl && row.data.metadataStatus !== "complete")
    .slice(0, BATCH_SIZE);
}

async function processRow(row) {
  const product = { ...(row.data || {}) };
  const sourceUrl = product.sourceUrl;
  console.info("Processing Source Scout product", {
    rowId: row.id,
    sourceHost: safeHost(sourceUrl)
  });

  try {
    const html = await fetchHtml(sourceUrl);
    const metadata = extractMetadata(html, sourceUrl);
    const update = buildProductUpdate(product, metadata, null);
    await saveProduct(row, update);
    console.info("Metadata updated", {
      rowId: row.id,
      metadataStatus: update.metadataStatus,
      draftScoreConfidence: update.draftScoreConfidence
    });
    return update.metadataStatus;
  } catch (error) {
    const update = buildProductUpdate(product, null, error);
    await saveProduct(row, update);
    console.warn("Metadata failed", {
      rowId: row.id,
      message: error?.message || "Unknown error"
    });
    return "failed";
  }
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "AAYNA-BuyOS-SourceScout/0.6 (+manual-review)",
        accept: "text/html,application/xhtml+xml"
      }
    });
    if (!response.ok) throw new Error(`Fetch failed with HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("Fetch did not return public HTML.");
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function extractMetadata(html, sourceUrl) {
  const jsonLdProducts = extractJsonLdProducts(html);
  const firstProduct = jsonLdProducts[0] || {};
  const image = pickFirst([
    metaTag(html, "property", "og:image"),
    metaTag(html, "name", "twitter:image"),
    firstProduct.image
  ]);
  const offers = Array.isArray(firstProduct.offers) ? firstProduct.offers[0] : firstProduct.offers || {};
  const rating = firstProduct.aggregateRating || {};
  const brand = typeof firstProduct.brand === "string" ? firstProduct.brand : firstProduct.brand?.name;

  return {
    title: cleanText(pickFirst([
      metaTag(html, "property", "og:title"),
      metaTag(html, "name", "twitter:title"),
      firstProduct.name,
      titleTag(html)
    ])),
    image: absoluteUrl(image, sourceUrl),
    description: cleanText(metaTag(html, "name", "description")),
    listedSourcePrice: toCleanNumber(offers.price),
    listedSourceCurrency: offers.priceCurrency || "",
    productRating: toCleanNumber(rating.ratingValue),
    reviewCount: toCleanInteger(rating.reviewCount),
    brandName: cleanText(brand),
    jsonLdProductFound: jsonLdProducts.length > 0
  };
}

function buildProductUpdate(product, metadata, error) {
  const next = { ...product };
  next.needsHumanReview = true;
  next.importStatus = next.importStatus || "needs_review";
  next.approvalStatus = next.approvalStatus || "Pending";
  next.metadataFetchedAt = new Date().toISOString();
  next.metadataSource = "source_scout_worker";

  if (error) {
    next.metadataStatus = "failed";
    next.metadataError = safeErrorMessage(error);
    next.missingFields = missingFields(next);
    next.draftScores = improvedDraftScores(next, null);
    next.draftScoreReason = "Metadata fetch failed; draft score still needs human review.";
    next.draftScoreConfidence = "low";
    next.draftScoreSource = "source_scout_worker";
    next.needsScoreReview = true;
    return next;
  }

  const hasUsefulMetadata = Boolean(metadata.title || metadata.image || metadata.description || metadata.productRating || metadata.reviewCount);
  next.scoutMetadata = {
    title: metadata.title || "",
    image: metadata.image || "",
    description: metadata.description || "",
    brandName: metadata.brandName || "",
    jsonLdProductFound: Boolean(metadata.jsonLdProductFound)
  };

  if (canFillProductName(next) && metadata.title) {
    next.productName = metadata.title;
    next.sourceScoutGeneratedTitle = false;
  }
  if (!next.productImageLink && metadata.image) next.productImageLink = metadata.image;
  if (!next.productRating && metadata.productRating) next.productRating = metadata.productRating;
  if (!next.reviewCount && metadata.reviewCount) next.reviewCount = metadata.reviewCount;
  if (!next.supplierName && metadata.brandName) next.supplierName = metadata.brandName;
  if (metadata.listedSourcePrice) {
    next.listedSourcePrice = metadata.listedSourcePrice;
    next.listedSourceCurrency = metadata.listedSourceCurrency || "";
    next.listedPriceFetchedAt = new Date().toISOString();
  }

  next.metadataStatus = hasUsefulMetadata ? "complete" : "partial";
  next.metadataError = "";
  next.missingFields = missingFields(next);
  next.draftScores = improvedDraftScores(next, metadata);
  next.draftScoreReason = draftScoreReason(next, metadata);
  next.draftScoreConfidence = draftConfidence(metadata, next.missingFields);
  next.draftScoreSource = "source_scout_worker";
  next.needsScoreReview = true;
  return next;
}

async function saveProduct(row, data) {
  if (DRY_RUN) {
    console.info("Dry run: skipped Supabase update", {
      rowId: row.id,
      metadataStatus: data.metadataStatus
    });
    return;
  }
  const { error } = await supabase
    .from("buyos_products")
    .update({
      data,
      sku: data.sku || row.sku || "",
      slug: data.slug || row.slug || slugify(data.productName || data.sku || "")
    })
    .eq("id", row.id)
    .eq("workspace_id", BUYOS_WORKSPACE_ID);
  if (error) throw error;
}

function canFillProductName(product) {
  const name = String(product.productName || "").trim().toLowerCase();
  return !name || name === "imported candidate" || product.sourceScoutGeneratedTitle === true;
}

function missingFields(product) {
  const checks = [
    ["unitCost", "unitCost"],
    ["supplierName", "supplierName"],
    ["productImageLink", "productImageLink"],
    ["productRating", "productRating"],
    ["reviewCount", "reviewCount"],
    ["soldCount", "soldCount"],
    ["competitorPrice", "competitorPrice"],
    ["finalApprovedQuantity", "finalApprovedQuantity"]
  ];
  return checks.filter(([key]) => product[key] === "" || product[key] === null || product[key] === undefined).map(([, label]) => label);
}

function improvedDraftScores(product, metadata) {
  const title = `${product.productName || ""} ${metadata?.title || ""} ${product.category || ""}`.toLowerCase();
  const scores = {
    feminine: /pearl|gold|rose|heart|bow|flower|charm|bead|cute/.test(title) ? 4 : 3,
    trendy: /viral|korean|minimal|hoop|clip|choker|layer|mini|pearl/.test(title) ? 4 : 3,
    aaynaFit: product.category && product.category !== "Other" ? 4 : 3,
    easyToStyle: /earring|necklace|bracelet|ring|hair|bag|scarf/.test(title) ? 4 : 3,
    lightweight: ["Earrings", "Ring", "Hair Accessory", "Bracelet", "Necklace"].includes(product.category) ? 4 : 3,
    reelsPhotos: metadata?.image ? 4 : 3,
    giftability: ["Earrings", "Necklace", "Bracelet", "Ring", "Gift Set"].includes(product.category) ? 4 : 3,
    priceFit: metadata?.listedSourcePrice ? 3 : 2,
    demand: Number(product.reviewCount || metadata?.reviewCount || 0) > 50 ? 4 : 3,
    qualityRisk: Number(product.productRating || metadata?.productRating || 0) >= 4 ? 4 : 3
  };
  return scores;
}

function draftScoreReason(product, metadata) {
  const signals = [];
  if (metadata?.title) signals.push("title");
  if (metadata?.image) signals.push("image");
  if (metadata?.productRating) signals.push("rating");
  if (metadata?.reviewCount) signals.push("review count");
  return `Draft score generated from public metadata (${signals.join(", ") || "limited signals"}). Human score review required.`;
}

function draftConfidence(metadata, missing) {
  const signalCount = [metadata?.title, metadata?.image, metadata?.productRating, metadata?.reviewCount].filter(Boolean).length;
  if (signalCount >= 3 && missing.length <= 4) return "medium";
  return "low";
}

function metaTag(html, attr, value) {
  const pattern = new RegExp(`<meta[^>]+${attr}=["']${escapeRegExp(value)}["'][^>]*>`, "i");
  const tag = html.match(pattern)?.[0] || "";
  return decodeHtml(attributeValue(tag, "content"));
}

function titleTag(html) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function extractJsonLdProducts(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const products = [];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeHtml(block[1].trim()));
      collectJsonLdProducts(parsed, products);
    } catch {
      // Ignore malformed page metadata.
    }
  }
  return products;
}

function collectJsonLdProducts(value, products) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdProducts(item, products));
    return;
  }
  if (!value || typeof value !== "object") return;
  const type = value["@type"];
  if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) products.push(value);
  if (value["@graph"]) collectJsonLdProducts(value["@graph"], products);
}

function attributeValue(tag, name) {
  return tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"))?.[1] || "";
}

function pickFirst(values) {
  for (const value of values.flat()) {
    if (value) return value;
  }
  return "";
}

function absoluteUrl(value, baseUrl) {
  if (!value) return "";
  try {
    return new URL(Array.isArray(value) ? value[0] : value, baseUrl).toString();
  } catch {
    return Array.isArray(value) ? value[0] : value;
  }
}

function toCleanNumber(value) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : "";
}

function toCleanInteger(value) {
  const number = Number.parseInt(String(value || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(number) && number > 0 ? number : "";
}

function cleanText(value) {
  return decodeHtml(String(value || "").replace(/\s+/g, " ").trim());
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, " ");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "unknown";
  }
}

function safeError(error) {
  return { message: error?.message || "Unknown error", code: error?.code || "" };
}

function safeErrorMessage(error) {
  return String(error?.message || "Unknown error").slice(0, 240);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
