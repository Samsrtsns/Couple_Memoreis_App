import { setAppLanguage } from "@/src/i18n";
import type { AppLanguage } from "@/src/i18n/translations";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActionSheetIOS, Alert, Platform, Text, TouchableOpacity, View } from "react-native";

export default function AppSettingsScreen() {
  const { t, i18n } = useTranslation();

  const languageOptions: { code: AppLanguage; label: string }[] = [
    { code: "tr", label: t("language.tr") },
    { code: "en", label: t("language.en") },
  ];

  const currentLanguageCode = (i18n.language || "tr").split("-")[0] as AppLanguage;
  const currentLanguageLabel =
    languageOptions.find((x) => x.code === currentLanguageCode)?.label ?? t("language.tr");

  const showLanguageChangedAlert = (language: AppLanguage) => {
    const fixedT = i18n.getFixedT(language);
    Alert.alert(fixedT("language.changedTitle"), fixedT("language.changedMessage"));
  };

  const handleSelectLanguage = () => {
    if (Platform.OS === "ios") {
      const options = [...languageOptions.map((x) => x.label), t("common.cancel")];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: t("language.chooseTitle"),
        },
        async (index) => {
          if (index >= languageOptions.length) return;
          const selected = languageOptions[index];
          await setAppLanguage(selected.code);
          showLanguageChangedAlert(selected.code);
        },
      );
      return;
    }

    Alert.alert(t("language.chooseTitle"), "", [
      ...languageOptions.map((x) => ({
        text: x.label,
        onPress: async () => {
          await setAppLanguage(x.code);
          showLanguageChangedAlert(x.code);
        },
      })),
      { text: t("common.cancel"), style: "cancel" as const },
    ]);
  };

  return (
    <View className="flex-1 bg-[#FDF8F7] p-6">
      <View className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
        <Text className="text-[13px] font-semibold leading-5 text-blue-800">
          {t("appSettings.upcomingFeatures")}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSelectLanguage}
        className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-x-3">
            <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center">
              <Ionicons name="language-outline" size={18} color="#2563EB" />
            </View>
            <View>
              <Text className="text-slate-800 font-bold text-[15px]">{t("language.title")}</Text>
              <Text className="text-slate-500 text-[12px]">{t("language.subtitle")}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-x-2">
            <Text className="text-slate-700 font-semibold">{currentLanguageLabel}</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
