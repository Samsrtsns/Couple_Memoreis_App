import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  initRevenueCat,
  fetchOfferings,
  findTargetOffering,
  checkTargetProducts,
  checkEntitlementStatus,
  openRevenueCatPaywall,
  fetchCustomerInfo,
  TARGET_OFFERING_ID,
  TARGET_PRODUCT_IDS,
  TARGET_ENTITLEMENT,
} from "@/src/services/revenuecat";
import type { PurchasesOfferings } from "react-native-purchases";

// ---------------------------------------------------------------------------
// Durum tipleri
// ---------------------------------------------------------------------------
type StepStatus = "idle" | "loading" | "success" | "fail";

interface StepState {
  status: StepStatus;
  detail: string;
}

const INITIAL: StepState = { status: "idle", detail: "" };

// ---------------------------------------------------------------------------
// Yardımcı UI bileşenleri
// ---------------------------------------------------------------------------
function statusIcon(s: StepStatus) {
  switch (s) {
    case "idle":
      return <Ionicons name="ellipse-outline" size={18} color="#94A3B8" />;
    case "loading":
      return <ActivityIndicator size="small" color="#3B82F6" />;
    case "success":
      return <Ionicons name="checkmark-circle" size={18} color="#16A34A" />;
    case "fail":
      return <Ionicons name="close-circle" size={18} color="#EF4444" />;
  }
}

function StatusCard({ label, state }: { label: string; state: StepState }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {statusIcon(state.status)}
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
      {state.detail !== "" && (
        <Text style={styles.cardDetail}>{state.detail}</Text>
      )}
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  disabled,
  color = "#3B82F6",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: color, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Debug ekranı
// ---------------------------------------------------------------------------
export default function RCDebugScreen() {
  const [initState, setInitState] = useState<StepState>(INITIAL);
  const [offeringState, setOfferingState] = useState<StepState>(INITIAL);
  const [productState, setProductState] = useState<StepState>(INITIAL);
  const [entitlementState, setEntitlementState] = useState<StepState>(INITIAL);
  const [paywallState, setPaywallState] = useState<StepState>(INITIAL);
  const [customerState, setCustomerState] = useState<StepState>(INITIAL);
  const [busy, setBusy] = useState(false);

  // Offering sonucunu sonraki adımlara aktarmak için ref-benzeri state
  const [cachedOfferings, setCachedOfferings] =
    useState<PurchasesOfferings | null>(null);

  // -- 1) Initialize --------------------------------------------------------
  const handleInit = useCallback(async () => {
    setInitState({ status: "loading", detail: "Configuring..." });
    const ok = await initRevenueCat();
    setInitState(
      ok
        ? { status: "success", detail: "SDK configured with Apple API key" }
        : { status: "fail", detail: "Configure failed — see terminal" },
    );
    return ok;
  }, []);

  // -- 2) Get Offerings -----------------------------------------------------
  const handleOfferings = useCallback(async () => {
    setOfferingState({ status: "loading", detail: "Fetching..." });
    const result = await fetchOfferings();
    setCachedOfferings(result);
    if (result) {
      const count = Object.keys(result.all).length;
      const target = findTargetOffering(result);
      setOfferingState({
        status: target ? "success" : "fail",
        detail: target
          ? `"${TARGET_OFFERING_ID}" found (${count} total offering)`
          : `"${TARGET_OFFERING_ID}" not found among ${count} offering(s): ${Object.keys(result.all).join(", ")}`,
      });
      return target;
    }
    setOfferingState({ status: "fail", detail: "Offerings fetch failed" });
    return null;
  }, []);

  // -- 3) Check Products ----------------------------------------------------
  const handleProduct = useCallback(async () => {
    let offerings = cachedOfferings;
    if (!offerings) {
      offerings = await fetchOfferings();
      setCachedOfferings(offerings);
    }
    const target = findTargetOffering(offerings);
    setProductState({ status: "loading", detail: "Searching..." });
    const pkgs = checkTargetProducts(target);
    setProductState(
      pkgs.length > 0
        ? {
            status: "success",
            detail: pkgs
              .map((p) => `${p.product.identifier} → ${p.product.priceString}`)
              .join("\n"),
          }
        : {
            status: "fail",
            detail: `Products not found: ${TARGET_PRODUCT_IDS.join(", ")}`,
          },
    );
    return pkgs;
  }, [cachedOfferings]);

  // -- 4) Check Entitlement -------------------------------------------------
  const handleEntitlement = useCallback(async () => {
    setEntitlementState({ status: "loading", detail: "Checking..." });
    const active = await checkEntitlementStatus();
    setEntitlementState(
      active
        ? { status: "success", detail: `"${TARGET_ENTITLEMENT}" ACTIVE` }
        : { status: "fail", detail: `"${TARGET_ENTITLEMENT}" inactive` },
    );
    return active;
  }, []);

  // -- 5) Open Paywall ------------------------------------------------------
  const handlePaywall = useCallback(async () => {
    setPaywallState({ status: "loading", detail: "Opening..." });
    const result = await openRevenueCatPaywall();
    const isGood = result.includes("PURCHASED") || result.includes("RESTORED");
    setPaywallState({
      status: isGood ? "success" : "fail",
      detail: result,
    });
  }, []);

  // -- 6) Customer Info -----------------------------------------------------
  const handleCustomerInfo = useCallback(async () => {
    setCustomerState({ status: "loading", detail: "Fetching..." });
    const info = await fetchCustomerInfo();
    setCustomerState(
      info
        ? {
            status: "success",
            detail: `User: ${info.originalAppUserId} | Active subs: ${Object.keys(info.activeSubscriptions).length}`,
          }
        : { status: "fail", detail: "Failed to fetch" },
    );
  }, []);

  // -- 7) Run All -----------------------------------------------------------
  const handleRunAll = useCallback(async () => {
    setBusy(true);
    // Sıralı: init → offerings → product → entitlement → customerInfo
    const initOk = await handleInit();
    if (initOk) {
      await handleOfferings();
      await handleProduct();
      await handleEntitlement();
      await handleCustomerInfo();
    }
    setBusy(false);
  }, [handleInit, handleOfferings, handleProduct, handleEntitlement, handleCustomerInfo]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Başlık */}
      <Text style={styles.title}>RevenueCat Debug</Text>
      <Text style={styles.subtitle}>Apple Store entegrasyon doğrulama ekranı</Text>

      {/* Sabitleri göster */}
      <View style={styles.constantsBox}>
        <Text style={styles.constLine}>Offering    : {TARGET_OFFERING_ID}</Text>
        <Text style={styles.constLine}>Products    : {TARGET_PRODUCT_IDS.join(", ")}</Text>
        <Text style={styles.constLine}>Entitlement : {TARGET_ENTITLEMENT}</Text>
      </View>

      {/* Durum kartları */}
      <StatusCard label="Initialize" state={initState} />
      <StatusCard label="Offering" state={offeringState} />
      <StatusCard label="Product" state={productState} />
      <StatusCard label="Entitlement" state={entitlementState} />
      <StatusCard label="Paywall" state={paywallState} />
      <StatusCard label="Customer Info" state={customerState} />

      {/* Butonlar */}
      <View style={styles.buttonsWrap}>
        <ActionButton title="Initialize RevenueCat" onPress={handleInit} />
        <ActionButton title="Get Offerings" onPress={handleOfferings} />
        <ActionButton title="Check Product" onPress={handleProduct} />
        <ActionButton title="Check Entitlement" onPress={handleEntitlement} />
        <ActionButton
          title="Open Paywall"
          onPress={handlePaywall}
          color="#EA5385"
        />
        <ActionButton title="Get Customer Info" onPress={handleCustomerInfo} />
        <ActionButton
          title={busy ? "Running..." : "▶  Run All (sıralı)"}
          onPress={handleRunAll}
          disabled={busy}
          color="#0F172A"
        />
      </View>

      {/* Uyarılar */}
      <View style={styles.warningBox}>
        <Ionicons name="warning" size={16} color="#D97706" />
        <Text style={styles.warningText}>
          Expo Go'da çalışmaz — development build gerekir.{"\n"}
          Detaylı loglar terminalde [RC ...] prefix'i ile görünür.
        </Text>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F7" },
  content: { padding: 20, paddingBottom: 60 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 16,
  },
  constantsBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  constLine: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#334155",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardLabel: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardDetail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  buttonsWrap: { marginTop: 16, gap: 10 },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
  },
  warningText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
});
