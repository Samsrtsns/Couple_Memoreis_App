import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, SUPPORTED_LANGUAGES, type AppLanguage } from "./translations";

export const LANGUAGE_STORAGE_KEY = "app.language";

function getDeviceLanguage(): AppLanguage {
  const locale = getLocales()?.[0]?.languageCode?.toLowerCase() ?? "tr";
  if (SUPPORTED_LANGUAGES.includes(locale as AppLanguage)) {
    return locale as AppLanguage;
  }
  return "tr";
}

export async function setAppLanguage(language: AppLanguage) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  await i18n.changeLanguage(language);
}

async function getInitialLanguage(): Promise<AppLanguage> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as AppLanguage)) {
      return stored as AppLanguage;
    }
    // If no language is explicitly set by the user, follow the device language
    // Do NOT save it to AsyncStorage so that it automatically updates if the user
    // changes their device language later.
    return getDeviceLanguage();
  } catch {
    // fallback to device language on error
  }
  return getDeviceLanguage();
}

void (async () => {
  const lng = await getInitialLanguage();
  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources,
    lng,
    fallbackLng: getDeviceLanguage(),
    interpolation: {
      escapeValue: false,
    },
  });
})();

export default i18n;
