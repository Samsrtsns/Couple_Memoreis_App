import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { calculateDaysTogether, parseDateOnlyString } from "../utils/dateUtils";
import ProfileAvatar from "./ProfileAvatar";

type Props = {
    relationshipStartDate?: string | null;
};

export default function RelationshipCard({ relationshipStartDate }: Props) {
    const { t, i18n } = useTranslation();
    const { state } = useAuth();
    const { profile, partner } = state;

    const hasPartner = !!partner?.id;

    if (state.isGuest) {
        return (
            <View className="px-6 bg-bgLight">
                <View
                    className="w-full mt-6 p-6 bg-bgLight border border-dashed border-slate-300"
                    style={{
                        borderRadius: 24,
                        shadowColor: "#94A3B8",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.12,
                        shadowRadius: 12,
                        elevation: 3,
                    }}
                >
                    <View className="items-center">
                        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-3">
                            <Ionicons name="glasses-outline" size={32} color="#64748B" />
                        </View>
                        <Text className="text-slate-900 font-bold text-lg text-center">
                            Misafir Modu
                        </Text>
                        <Text className="text-slate-500 text-sm text-center mt-2 leading-5 px-1">
                            Misafir modu uygulamanın içeriğini görmeniz için var. Tam erişim için lütfen hesap oluşturunuz.
                        </Text>
                        <Pressable
                            onPress={() => router.push("/(tabs)/profile")}
                            className="mt-5 bg-[#ea5385] px-6 py-3 rounded-2xl active:opacity-90"
                        >
                            <Text className="text-white font-bold text-[15px]">Hesap Oluştur</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    if (!hasPartner) {
        return (
            <View className="px-6 bg-bgLight">
                <View
                    className="w-full mt-6 p-6 bg-bgLight border border-dashed border-rose-200"
                    style={{
                        borderRadius: 24,
                        shadowColor: "#FF8A8A",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.12,
                        shadowRadius: 12,
                        elevation: 3,
                    }}
                >
                    <View className="items-center">
                        <View className="w-16 h-16 rounded-full bg-rose-50 items-center justify-center mb-3">
                            <Ionicons name="people-outline" size={32} color="#F43F5E" />
                        </View>
                        <Text className="text-slate-900 font-bold text-lg text-center">
                            {t("home.notMatched")}
                        </Text>
                        <Text className="text-slate-500 text-sm text-center mt-2 leading-5 px-1">
                            {t("home.connectHint")}
                        </Text>
                        <Pressable
                            onPress={() => router.push("/(pairing)/pair")}
                            className="mt-5 bg-[#ea5385] px-6 py-3 rounded-2xl active:opacity-90"
                        >
                            <Text className="text-white font-bold text-[15px]">{t("home.matchPartner")}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    if (!relationshipStartDate) return null;

    const daysTogether = calculateDaysTogether(relationshipStartDate);

    const relationDate = parseDateOnlyString(relationshipStartDate);
    if (!relationDate) return null;

    const formattedDate = relationDate.toLocaleDateString(
        i18n.language || "tr-TR",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );

    return (
        <View className="px-6 bg-bgLight">
            <View
                className="flex-col w-full items-center mt-6 p-6 bg-bgLight"
                style={{
                    borderRadius: 24,
                    shadowColor: "#FF8A8A",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                }}
            >
                <View className="flex-row items-center gap-x-6 ">
                    <ProfileAvatar
                        url={profile?.avatar_url}
                        size={104}
                        style={{ borderWidth: 3, borderColor: "#fff" }}
                    />

                    <Ionicons name="heart" size={52} color="#FF8A8A" />

                    <ProfileAvatar
                        url={partner?.avatar_url}
                        size={104}
                        style={{ borderWidth: 3, borderColor: "#fff" }}
                    />
                </View>

                <View className="flex-col items-start w-full mt-6 px-1">
                    <Text className="text-slate-900 font-bold text-[20px] text-left leading-8">
                        {t("home.togetherForPrefix", {
                            name: partner?.first_name ?? "",
                        })}
                        <Text className="text-primary font-bold text-[22px]">{daysTogether}</Text>
                        {t("home.togetherForSuffix")}
                    </Text>

                    <View className="mt-1">
                        <Text className="text-left text-slate-500 font-semibold text-[16px]">
                            {t("home.togetherSinceDate", { date: formattedDate })}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
