import PrimaryButton from "@/src/components/PrimaryButton";
import { TextInputArea } from "@/src/components/TextInput";
import { usePair } from "@/src/hooks/usePair";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
    ActivityIndicator,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function PairScreen() {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { state: { profile, partner } } = useAuth();
    const { from } = useLocalSearchParams<{ from?: string }>();
    
    // Automatically redirect when the active relationship setup is complete globally via Realtime
    useEffect(() => {
        if (partner && profile?.birth_date) {
            router.replace("/(tabs)/home");
        }
    }, [partner, profile]);
    const {
        myCode,
        partnerCode,
        setPartnerCode,
        loading,
        copyCode,
        shareCode,
        connectPartner,
    } = usePair();

    const formattedCode = String(myCode || "")
        .replace(/\s/g, "")
        .split("")
        .join(" ");

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 items-center bg-bgLight">
                <KeyboardAwareScrollView
                    enableOnAndroid
                    enableAutomaticScroll
                    enableResetScrollToCoords={false}
                    extraScrollHeight={Platform.OS === "ios" ? 96 : 88}
                    extraHeight={32}
                    keyboardOpeningTime={250}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator
                    style={{ flex: 1, width: "100%" }}
                    contentContainerStyle={{
                        paddingTop: 0,
                        paddingBottom: Math.max(insets.bottom, 16) + 100,
                    }}
                >
                    {/* Back Button */}
                    <View className="flex-row w-full justify-start items-start mt-16 px-5">
                        <Pressable
                            onPress={() => {
                                if (from === "register") {
                                    router.replace("/(tabs)/home");
                                } else {
                                    router.back();
                                }
                            }}
                            className="items-center justify-center"
                        >
                            <Ionicons name="chevron-back" size={28} color="#0f172a" />
                        </Pressable>
                    </View>

                    {/* Header and subhead text */}
                    <View className="flex-col justify-center items-center w-full mt-4 gap-y-2 px-6">
                        <Text className="text-center text-[26px] font-bold">
                            {t("pairing.title")}
                        </Text>
                        <Text className="text-center text-[14px] font-normal text-slate-500">
                            {t("pairing.subtitle")}
                        </Text>
                    </View>

                    {/* Code Card */}
                    <View className="w-full items-center mt-8 px-6">
                        <View className="w-full max-h-[300px] bg-bgLight rounded-3xl shadow-lg justify-center items-center">
                            <View className="flex-col items-center p-6 w-full h-full rounded-3xl">
                                <View className="w-20 h-20 rounded-full bg-[#E65D4F]/20 items-center justify-center">
                                    <Ionicons name="heart" size={30} color="#FF7F6E" />
                                </View>

                                <Text className="mt-6 text-[#E65D4F] uppercase text-xs font-bold tracking-[2px]">
                                    {t("pairing.inviteCodeLabel")}
                                </Text>

                                <Text className="mt-6 font-bold text-[42px] text-slate-900 tracking-[6px]">
                                    {formattedCode || "0 0 0 0 0 0"}
                                </Text>

                                {/* Actions */}
                                <View className="flex-row w-full gap-3 mt-8">
                                    <Pressable
                                        onPress={copyCode}
                                        className="flex-1 h-12 rounded-2xl bg-black flex-row items-center justify-center"
                                    >
                                        <Ionicons name="copy-outline" size={18} color="#ffffff" />
                                        <Text className="ml-2 text-white font-semibold">
                                            {t("pairing.copy")}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={shareCode}
                                        className="flex-1 h-12 rounded-2xl bg-[#FF7F6E] flex-row items-center justify-center"
                                    >
                                        <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                                        <Text className="ml-2 text-white font-semibold">
                                            {t("pairing.share")}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                        {/* Divider */}
                        <View className="flex-row items-center w-full gap-4 py-4 mt-8">
                            <View className="flex-1 h-[1px] bg-slate-200" />
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-[3px]">
                                {t("pairing.orJoin")}
                            </Text>
                            <View className="flex-1 h-[1px] bg-slate-200" />
                        </View>

                        {/* Input Field Section */}
                        <View className="w-full gap-y-4">

                            <TextInputArea label={""} value={partnerCode} onChangeText={setPartnerCode} placeholder={t("pairing.partnerCodePlaceholder")} autoCapitalize="characters" ></TextInputArea>

                            <PrimaryButton title={t("pairing.connectNow")} onPress={connectPartner}></PrimaryButton>
                        </View>

                        {loading && (
                            <Modal transparent visible={loading} animationType="fade">
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#ea5385" />
                                </View>
                            </Modal>
                        )}

                    </View>

                </KeyboardAwareScrollView>
            </View >
        </TouchableWithoutFeedback >
    );
}
