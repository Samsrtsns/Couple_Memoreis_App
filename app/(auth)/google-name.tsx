import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { useAuth } from "@/src/context/AuthContext";
import { updateProfile } from "@/src/services/profileService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

export default function GoogleNameScreen() {
  const { state, refreshProfile } = useAuth();
  const user = state.user;

  const initialFromMeta = useMemo(() => {
    const full = (user?.user_metadata?.full_name as string | undefined) ?? "";
    const fromGiven = (user?.user_metadata?.given_name as string | undefined) ?? "";
    const fromFamily = (user?.user_metadata?.family_name as string | undefined) ?? "";

    if (fromGiven || fromFamily) {
      return {
        first: fromGiven,
        last: fromFamily,
      };
    }

    const parts = full.trim().split(/\s+/).filter(Boolean);
    return {
      first: parts[0] ?? "",
      last: parts.slice(1).join(" "),
    };
  }, [user?.user_metadata]);

  const [firstName, setFirstName] = useState(initialFromMeta.first);
  const [lastName, setLastName] = useState(initialFromMeta.last);
  const [loading, setLoading] = useState(false);

  const goNext = async () => {
    await AsyncStorage.removeItem("pendingGoogleOnboarding");
    await AsyncStorage.setItem("redirectToPairAfterRegister", "true");
    router.replace("/(pairing)/pair?from=register");
  };

  const handleSkip = async () => {
    await goNext();
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Hata", "Kullanıcı oturumu bulunamadı.");
      return;
    }

    const f = firstName.trim();
    const l = lastName.trim();
    if (!f || !l) {
      Alert.alert("Eksik bilgi", "Lütfen ad ve soyad girin veya atla seçin.");
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        userId: user.id,
        first_name: f,
        last_name: l,
      });
      await refreshProfile();
      await goNext();
    } catch (e: unknown) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Profil güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 bg-bgLight px-6 pt-10">
        <Text className="text-3xl font-black text-bgDark" style={{ fontFamily: "InterBlack" }}>
          Adını ekle
        </Text>
        <Text className="mt-2 text-slate-500 text-base">
          Uygulamada adını görmek için ad ve soyadını ekleyebilirsin.
        </Text>

        <View className="mt-8 gap-y-5">
          <TextInputArea
            label="Ad"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Adın"
            autoCapitalize="words"
          />
          <TextInputArea
            label="Soyad"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Soyadın"
            autoCapitalize="words"
          />
        </View>

        <View className="mt-8 gap-y-3">
          <PrimaryButton title="Kaydet ve devam et" loading={loading} onPress={handleSave} />
          <Pressable onPress={handleSkip} className="h-12 items-center justify-center">
            <Text className="text-slate-500 font-semibold">Şimdilik atla</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
