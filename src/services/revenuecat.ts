import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
} from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";

// ---------------------------------------------------------------------------
// Sabitler — RC Dashboard'taki Apple Store yapılandırmasıyla birebir eşleşmeli
// ---------------------------------------------------------------------------
const RC_APPLE_API_KEY = "appl_XhgUCLIKAhPjCsTnsLSivYFSRoA";
const TARGET_OFFERING_ID = "loveLinePro";
const TARGET_PRODUCT_IDS = ["re_lL_1m_5", "re_lL_1y_49"] as const;
const TARGET_ENTITLEMENT = "loveLinePro";

// ---------------------------------------------------------------------------
// Yardımcı — her satırı prefix'li basar
// ---------------------------------------------------------------------------
function log(tag: string, ...args: unknown[]) {
  console.log(`[RC ${tag}]`, ...args);
}

// ---------------------------------------------------------------------------
// 1) initRevenueCat
//    SDK'yı Apple API key ile başlatır. Sadece 1 kere çağrılmalı.
// ---------------------------------------------------------------------------
export async function initRevenueCat(): Promise<boolean> {
  try {
    log("INIT", "RevenueCat initialization started");
    log("INIT", "Setting log level to DEBUG");
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    log("INIT", "Configuring with Apple API key:", RC_APPLE_API_KEY);
    Purchases.configure({ apiKey: RC_APPLE_API_KEY });

    log("INIT", "Configure SUCCESS ✓");
    return true;
  } catch (error) {
    log("ERROR", "initRevenueCat failed:", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 2) fetchOfferings
//    Tüm offering'leri çeker, her birinin identifier + paket sayısını loglar.
// ---------------------------------------------------------------------------
export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  try {
    log("OFFERINGS", "Fetch started...");
    const offerings = await Purchases.getOfferings();

    const allKeys = Object.keys(offerings.all);
    log("OFFERINGS", `Total offering count: ${allKeys.length}`);
    log("OFFERINGS", "All offering identifiers:", allKeys);

    allKeys.forEach((key) => {
      const o = offerings.all[key];
      const pkgs = o.availablePackages;
      log(
        "OFFERINGS",
        `  → "${key}" | ${pkgs.length} package(s):`,
        pkgs.map((p) => `${p.identifier} (${p.product.identifier})`),
      );
    });

    if (offerings.current) {
      log(
        "OFFERINGS",
        "Current (default) offering:",
        offerings.current.identifier,
      );
    } else {
      log("OFFERINGS", "Current offering is NULL — dashboard'ta default atanmamış olabilir");
    }

    log("OFFERINGS", "Fetch complete ✓");
    return offerings;
  } catch (error) {
    log("ERROR", "fetchOfferings failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3) findTargetOffering
//    Çekilen offering map'inde TARGET_OFFERING_ID'yi arar.
// ---------------------------------------------------------------------------
export function findTargetOffering(
  offerings: PurchasesOfferings | null,
): PurchasesOffering | null {
  if (!offerings) {
    log("OFFERINGS", "Cannot search — offerings is null");
    return null;
  }

  log("OFFERINGS", `Searching for target offering: "${TARGET_OFFERING_ID}"`);
  const target = offerings.all[TARGET_OFFERING_ID] ?? null;

  if (target) {
    log("OFFERINGS", `Found target offering: "${TARGET_OFFERING_ID}" ✓`);
    log(
      "OFFERINGS",
      `  Packages (${target.availablePackages.length}):`,
      target.availablePackages.map(
        (p) =>
          `${p.identifier} → product: ${p.product.identifier}, price: ${p.product.priceString}`,
      ),
    );
  } else {
    log(
      "OFFERINGS",
      `Target offering "${TARGET_OFFERING_ID}" NOT FOUND ✗`,
    );
    log(
      "OFFERINGS",
      "Available keys:",
      Object.keys(offerings.all),
    );
  }

  return target;
}

// ---------------------------------------------------------------------------
// 4) checkTargetProducts
//    Verilen offering içinde TARGET_PRODUCT_IDS'deki ürünleri arar.
// ---------------------------------------------------------------------------
export function checkTargetProducts(
  offering: PurchasesOffering | null,
): PurchasesPackage[] {
  if (!offering) {
    log("PRODUCT", "Cannot check — offering is null");
    return [];
  }

  log("PRODUCT", `Searching for products: ${TARGET_PRODUCT_IDS.join(", ")} in offering "${offering.identifier}"`);

  const found: PurchasesPackage[] = [];

  for (const productId of TARGET_PRODUCT_IDS) {
    const pkg = offering.availablePackages.find(
      (p) => p.product.identifier === productId,
    );

    if (pkg) {
      log("PRODUCT", `Product FOUND: "${productId}" ✓`);
      log("PRODUCT", `  Package identifier : ${pkg.identifier}`);
      log("PRODUCT", `  Product identifier : ${pkg.product.identifier}`);
      log("PRODUCT", `  Price              : ${pkg.product.priceString}`);
      log("PRODUCT", `  Package type       : ${pkg.packageType}`);
      log("PRODUCT", `  Description        : ${pkg.product.description}`);
      found.push(pkg);
    } else {
      log("PRODUCT", `Product "${productId}" NOT FOUND ✗`);
    }
  }

  if (found.length === 0) {
    log(
      "PRODUCT",
      "Available products in this offering:",
      offering.availablePackages.map((p) => p.product.identifier),
    );
  }

  return found;
}

// ---------------------------------------------------------------------------
// 5) checkEntitlementStatus
//    Aktif entitlement'ları çeker, TARGET_ENTITLEMENT'ı kontrol eder.
// ---------------------------------------------------------------------------
export async function checkEntitlementStatus(): Promise<boolean> {
  try {
    log("ENTITLEMENT", `Checking entitlement: "${TARGET_ENTITLEMENT}"`);
    const customerInfo = await Purchases.getCustomerInfo();

    const activeIds = Object.keys(customerInfo.entitlements.active);
    log("ENTITLEMENT", "Active entitlements:", activeIds.length ? activeIds : "(none)");

    const isActive =
      typeof customerInfo.entitlements.active[TARGET_ENTITLEMENT] !==
      "undefined";

    if (isActive) {
      const ent = customerInfo.entitlements.active[TARGET_ENTITLEMENT];
      log("ENTITLEMENT", `"${TARGET_ENTITLEMENT}" is ACTIVE ✓`);
      log("ENTITLEMENT", `  Product identifier : ${ent.productIdentifier}`);
      log("ENTITLEMENT", `  Will renew         : ${ent.willRenew}`);
      log("ENTITLEMENT", `  Expires date       : ${ent.expirationDate ?? "never"}`);
    } else {
      log("ENTITLEMENT", `"${TARGET_ENTITLEMENT}" is INACTIVE ✗`);
    }

    return isActive;
  } catch (error) {
    log("ERROR", "checkEntitlementStatus failed:", error);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6) openRevenueCatPaywall
//    RC UI paywall'ını açar. Dashboard'ta offering'e paywall şablonu atanmalı.
// ---------------------------------------------------------------------------
export async function openRevenueCatPaywall(): Promise<string> {
  try {
    log("PAYWALL", "Opening paywall...");
    log("PAYWALL", `Required entitlement: "${TARGET_ENTITLEMENT}"`);

    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: TARGET_ENTITLEMENT,
    });

    const label =
      result === "NOT_PRESENTED"
        ? "NOT_PRESENTED (entitlement already active)"
        : result === "PURCHASED"
          ? "PURCHASED ✓"
          : result === "RESTORED"
            ? "RESTORED ✓"
            : result === "CANCELLED"
              ? "CANCELLED (user dismissed)"
              : String(result);

    log("PAYWALL", "Result:", label);
    return label;
  } catch (error) {
    log("ERROR", "openRevenueCatPaywall failed:", error);
    return `ERROR: ${error}`;
  }
}

// ---------------------------------------------------------------------------
// 7) fetchCustomerInfo
//    Tam müşteri bilgisini çeker ve detaylı loglar.
// ---------------------------------------------------------------------------
export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    log("CUSTOMERINFO", "Fetching customer info...");
    const info = await Purchases.getCustomerInfo();

    log("CUSTOMERINFO", "Original App User ID :", info.originalAppUserId);
    log("CUSTOMERINFO", "First seen           :", info.firstSeen);
    log("CUSTOMERINFO", "Active subscriptions :", Object.keys(info.activeSubscriptions).length ? Object.keys(info.activeSubscriptions) : "(none)");
    log("CUSTOMERINFO", "All entitlements     :", Object.keys(info.entitlements.all).length ? Object.keys(info.entitlements.all) : "(none)");
    log("CUSTOMERINFO", "Active entitlements  :", Object.keys(info.entitlements.active).length ? Object.keys(info.entitlements.active) : "(none)");
    log("CUSTOMERINFO", "Non-consumable purchases:", info.nonSubscriptionTransactions?.length ?? 0);
    log("CUSTOMERINFO", "Request date         :", info.requestDate);
    log("CUSTOMERINFO", "Full dump:", JSON.stringify(info, null, 2));

    return info;
  } catch (error) {
    log("ERROR", "fetchCustomerInfo failed:", error);
    return null;
  }
}

// Re-export sabitler (debug ekranında göstermek için)
export {
  RC_APPLE_API_KEY,
  TARGET_OFFERING_ID,
  TARGET_PRODUCT_IDS,
  TARGET_ENTITLEMENT,
};
