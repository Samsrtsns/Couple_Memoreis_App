import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

import { HEADER_HIT, HEADER_ICON_SM } from "./_headerMetrics";

/**
 * Profil yığını ile aynı app bar renkleri; geri: küçük ikon, dikey ortalı, yuvarlak dokunma alanı.
 */
export default function EventsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "",
        headerStyle: { backgroundColor: "#FDF8F7" },
        headerShadowVisible: false,
        headerTintColor: "#0F172A",
        contentStyle: { backgroundColor: "#FDF8F7" },
        headerTitleAlign: "center",
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={{
              width: HEADER_HIT,
              height: HEADER_HIT,
              borderRadius: HEADER_HIT / 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="chevron-back"
              size={HEADER_ICON_SM}
              color="#0F172A"
            />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="index" options={{ title: "Özel Günler" }} />
    </Stack>
  );
}
