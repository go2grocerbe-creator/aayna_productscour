import { isSupabaseConfigured, supabase, getAuthSession, getAuthUser } from "./supabaseClient.js";

const PRODUCTS_STORAGE_KEY = "aaynaProducts";
const SETTINGS_STORAGE_KEY = "aaynaSettings";
const APP_SCHEMA_VERSION = 3;
const BACKUP_APP_MARKER = "AAYNABuyOS";

let storageMode = "local";
let currentUser = null;
let currentWorkspace = null;
let lastStatus = "";
let lastError = "";
let lastCloudRowsLoaded = 0;
let lastCloudProductsLoaded = 0;
let lastCloudReloadAt = "";

export async function initializeStorage() {
  storageMode = "local";
  currentUser = null;
  currentWorkspace = null;
  lastStatus = "";
  lastError = "";
  lastCloudRowsLoaded = 0;
  lastCloudProductsLoaded = 0;
  lastCloudReloadAt = "";

  if (!isSupabaseConfigured || !supabase) {
    lastStatus = "Local mode: Supabase is not configured.";
    return localState(lastStatus);
  }

  try {
    const session = await getAuthSession();
    currentUser = session?.user || null;
    if (!currentUser) {
      lastStatus = "Cloud sync requires sign-in.";
      return localState(lastStatus);
    }

    currentWorkspace = await fetchFirstWorkspaceForUser(currentUser.id);
    if (!currentWorkspace) {
      lastError = "No BuyOS workspace found for this account. Add the user to buyos_members in Supabase.";
      return localState(lastError);
    }

    storageMode = "cloud";
    lastStatus = `Cloud mode: ${currentWorkspace.name || "AAYNA BuyOS"}`;
    return {
      mode: storageMode,
      user: currentUser,
      workspace: currentWorkspace,
      status: lastStatus,
      error: "",
      products: await loadProducts(),
      settings: await loadSettings()
    };
  } catch (error) {
    lastError = error?.message?.startsWith("Cloud product load failed:")
      ? error.message
      : "Cloud load failed. Local mode is still available.";
    console.warn("BuyOS cloud initialize failed", safeError(error));
    return localState(lastError);
  }
}

export function getStorageMode() {
  return storageMode;
}

export function getStorageStatus() {
  return lastStatus;
}

export function getStorageError() {
  return lastError;
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentWorkspace() {
  return currentWorkspace;
}

export function getStorageDiagnostics() {
  return {
    cloudRowsLoaded: lastCloudRowsLoaded,
    cloudProductsLoaded: lastCloudProductsLoaded,
    localProductsStored: loadLocalProducts().length,
    lastCloudReloadAt
  };
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return initializeStorage();
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  return initializeStorage();
}

export async function loadBuyosState() {
  return initializeStorage();
}

export async function saveBuyosState(state) {
  if (storageMode !== "cloud") {
    if (Array.isArray(state.products)) saveLocalProducts(state.products);
    if (state.settings) saveLocalSettings(state.settings);
    return;
  }
  if (state.settings) await saveSettings(state.settings);
  if (Array.isArray(state.products)) {
    for (const product of state.products) {
      await saveProduct(product);
    }
  }
}

export async function loadProducts() {
  if (storageMode !== "cloud" || !currentWorkspace) return loadLocalProducts();

  console.info("[BuyOS] Loading cloud products", {
    workspaceId: currentWorkspace.id,
    storageMode,
    signedIn: Boolean(currentUser)
  });

  const { data, error } = await supabase
    .from("buyos_products")
    .select("id, workspace_id, legacy_id, sku, slug, data, created_at, updated_at")
    .eq("workspace_id", currentWorkspace.id)
    .order("updated_at", { ascending: false });

  if (error) {
    lastError = `Cloud product load failed: ${error.message || "Supabase query failed"}`;
    throw new Error(lastError);
  }

  const rows = Array.isArray(data) ? data : [];
  const loadedProducts = rows
    .map(mapSupabaseProductRow)
    .filter(Boolean);

  lastCloudRowsLoaded = rows.length;
  lastCloudProductsLoaded = loadedProducts.length;
  lastCloudReloadAt = new Date().toISOString();
  lastError = "";

  console.info("[BuyOS] Cloud products loaded", {
    rowCount: rows.length,
    productCount: loadedProducts.length,
    firstRowId: rows[0]?.id || null
  });

  console.info("[BuyOS] Cloud row mapping", {
    rowCount: rows.length,
    mappedCount: loadedProducts.length,
    droppedCount: rows.length - loadedProducts.length,
    firstRowId: rows[0]?.id || null,
    firstMappedId: loadedProducts[0]?.id || null,
    firstMappedDbId: loadedProducts[0]?.dbId || null
  });

  return loadedProducts;
}

export async function saveProduct(product) {
  if (storageMode !== "cloud" || !currentWorkspace || !currentUser) {
    const products = loadLocalProducts();
    const nextProduct = { ...product };
    const index = products.findIndex((item) => item.id === nextProduct.id);
    if (index >= 0) products[index] = nextProduct;
    else products.unshift(nextProduct);
    saveLocalProducts(products);
    return nextProduct;
  }

  const productWithIds = {
    ...product,
    id: product.id || product.legacyId || crypto.randomUUID()
  };
  const existingRowId = await findExistingProductRow(productWithIds);
  const payload = {
    workspace_id: currentWorkspace.id,
    legacy_id: productWithIds.legacyId || productWithIds.id,
    sku: productWithIds.sku || "",
    slug: productWithIds.slug || slugify(productWithIds.productName || productWithIds.sku),
    data: productWithIds,
    updated_by: currentUser.id
  };

  if (existingRowId) {
    const { data, error } = await supabase
      .from("buyos_products")
      .update(payload)
      .eq("id", existingRowId)
      .select("id")
      .single();
    if (error) throw error;
    await logAuditEvent("product_updated", { productName: productWithIds.productName }, data.id);
    return { ...productWithIds, dbId: data.id };
  }

  const { data, error } = await supabase
    .from("buyos_products")
    .insert({ ...payload, created_by: currentUser.id })
    .select("id")
    .single();
  if (error) throw error;
  await logAuditEvent("product_created", { productName: productWithIds.productName }, data.id);
  return { ...productWithIds, dbId: data.id };
}

export async function deleteProduct(productId) {
  if (storageMode !== "cloud" || !currentWorkspace) {
    saveLocalProducts(loadLocalProducts().filter((product) => product.id !== productId && product.dbId !== productId));
    return;
  }

  const products = await loadProducts();
  const product = products.find((item) => item.id === productId || item.dbId === productId);
  if (!product) return;
  const { error } = await supabase
    .from("buyos_products")
    .delete()
    .eq("id", product.dbId);
  if (error) throw error;
  await logAuditEvent("product_deleted", { productName: product.productName }, product.dbId);
}

export async function loadSettings() {
  if (storageMode !== "cloud" || !currentWorkspace) return loadLocalSettings();

  const { data, error } = await supabase
    .from("buyos_settings")
    .select("id, data")
    .eq("workspace_id", currentWorkspace.id)
    .maybeSingle();

  if (error) throw error;
  return data?.data || loadLocalSettings();
}

export async function saveSettings(settings) {
  if (storageMode !== "cloud" || !currentWorkspace || !currentUser) {
    saveLocalSettings(settings);
    return settings;
  }

  const { data: existing, error: findError } = await supabase
    .from("buyos_settings")
    .select("id")
    .eq("workspace_id", currentWorkspace.id)
    .maybeSingle();
  if (findError) throw findError;

  const payload = {
    workspace_id: currentWorkspace.id,
    data: settings
  };

  const result = existing?.id
    ? await supabase.from("buyos_settings").update(payload).eq("id", existing.id)
    : await supabase.from("buyos_settings").insert(payload);

  if (result.error) throw result.error;
  await logAuditEvent("settings_updated", {}, null);
  return settings;
}

export async function migrateLocalToSupabase() {
  if (storageMode !== "cloud" || !currentWorkspace || !currentUser) {
    throw new Error("Cloud migration requires sign-in and workspace membership.");
  }

  const localProducts = loadLocalProducts();
  const localSettings = loadLocalSettings();
  const cloudProducts = await loadProducts();
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const product of localProducts) {
    if (hasCloudMatch(product, cloudProducts)) {
      skipped += 1;
      continue;
    }
    try {
      const saved = await saveProduct(product);
      cloudProducts.push(saved);
      uploaded += 1;
    } catch (error) {
      failed += 1;
      console.warn("BuyOS product migration failed", safeError(error));
    }
  }

  await saveSettings(localSettings);
  await logAuditEvent("local_migrated_to_cloud", { uploaded, skipped, failed }, null);
  return { uploaded, skipped, failed, settingsUploaded: true };
}

export async function logAuditEvent(eventType, details = {}, productId = null) {
  if (storageMode !== "cloud" || !currentWorkspace || !currentUser) return;
  try {
    const { error } = await supabase.from("buyos_audit_events").insert({
      workspace_id: currentWorkspace.id,
      product_id: productId,
      event_type: eventType,
      details,
      created_by: currentUser.id
    });
    if (error) throw error;
  } catch (error) {
    console.warn("BuyOS audit event skipped", safeError(error));
  }
}

export function clearLocalBuyosData() {
  localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  localStorage.removeItem(SETTINGS_STORAGE_KEY);
}

function localState(status) {
  return {
    mode: "local",
    user: currentUser,
    workspace: null,
    status,
    error: lastError,
    products: loadLocalProducts(),
    settings: loadLocalSettings()
  };
}

function mapSupabaseProductRow(row) {
  if (!row?.id) return null;
  if (!isObjectLike(row.data)) return null;

  const product = { ...row.data };
  product.dbId = row.id;
  product.id = product.id || row.legacy_id || row.id;
  product.legacyId = row.legacy_id || product.legacyId || "";
  product.sku = product.sku || row.sku || "";
  product.slug = product.slug || row.slug || "";
  product.launchStatus = product.launchStatus || (product.approvalStatus === "Approved" ? "shortlisted" : "");
  product.launchChecklist = {
    productNameReady: false,
    descriptionReady: false,
    priceConfirmed: false,
    imagesReady: false,
    stockConfirmed: false,
    websiteExportReady: false,
    instagramContentPlanned: false,
    ...(isObjectLike(product.launchChecklist) ? product.launchChecklist : {})
  };
  return product;
}

function isObjectLike(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchFirstWorkspaceForUser(userId) {
  const joined = await supabase
    .from("buyos_members")
    .select("workspace_id, buyos_workspaces(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!joined.error && joined.data) {
    const workspace = joined.data.buyos_workspaces;
    if (workspace?.id) return workspace;
    if (joined.data.workspace_id) return fetchWorkspaceById(joined.data.workspace_id);
  }

  const direct = await supabase
    .from("buyos_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (direct.error || !direct.data?.workspace_id) return null;
  return fetchWorkspaceById(direct.data.workspace_id);
}

async function fetchWorkspaceById(workspaceId) {
  const { data, error } = await supabase
    .from("buyos_workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findExistingProductRow(product) {
  if (product.dbId) return product.dbId;

  const legacyId = product.legacyId || product.id;
  if (legacyId) {
    const match = await findSingleProductBy("legacy_id", legacyId);
    if (match) return match.id;
  }

  const sku = String(product.sku || "").trim();
  if (sku) {
    const match = await findUniqueProductBy("sku", sku);
    if (match) return match.id;
  }

  const slug = product.slug || slugify(product.productName || sku);
  if (slug) {
    const match = await findUniqueProductBy("slug", slug);
    if (match) return match.id;
  }

  return null;
}

async function findSingleProductBy(column, value) {
  const { data, error } = await supabase
    .from("buyos_products")
    .select("id")
    .eq("workspace_id", currentWorkspace.id)
    .eq(column, value)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function findUniqueProductBy(column, value) {
  const { data, error } = await supabase
    .from("buyos_products")
    .select("id")
    .eq("workspace_id", currentWorkspace.id)
    .eq(column, value)
    .limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0] : null;
}

function hasCloudMatch(product, cloudProducts) {
  const localId = normalizeKey(product.legacyId || product.id);
  const sku = normalizeKey(product.sku);
  const slug = normalizeKey(product.slug || slugify(product.productName || product.sku));
  return cloudProducts.some((cloudProduct) => {
    const cloudId = normalizeKey(cloudProduct.legacyId || cloudProduct.id);
    const cloudSku = normalizeKey(cloudProduct.sku);
    const cloudSlug = normalizeKey(cloudProduct.slug || slugify(cloudProduct.productName || cloudProduct.sku));
    return (localId && localId === cloudId)
      || (sku && sku === cloudSku)
      || (slug && slug === cloudSlug);
  });
}

function loadLocalProducts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCTS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : (parsed.products || []);
  } catch {
    return [];
  }
}

function saveLocalProducts(products) {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify({
    app: BACKUP_APP_MARKER,
    schemaVersion: APP_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    products
  }));
}

function loadLocalSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
    return parsed.settings || parsed;
  } catch {
    return {};
  }
}

function saveLocalSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    app: BACKUP_APP_MARKER,
    schemaVersion: APP_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    settings
  }));
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeError(error) {
  return {
    message: error?.message || "Unknown error",
    code: error?.code || ""
  };
}

export { isSupabaseConfigured, getAuthSession, getAuthUser };
