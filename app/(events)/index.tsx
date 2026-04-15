import SpecialDayCard from "@/src/components/SpecialDayCard";
import { useAuth } from "@/src/context/AuthContext";
import { AddSpecialDayModal } from "@/src/features/specialDays/components/AddSpecialDayModal";
import { useSpecialDays } from "@/src/features/specialDays/hooks/useSpecialDays";
import type { SpecialDay } from "@/src/features/specialDays/types/specialDay.types";
import { iconNameForSpecialDayId } from "@/src/features/specialDays/utils/specialDayIcons";
import { calculateDaysRemaining, SpecialEvent } from "@/src/utils/dateUtils";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { HEADER_HIT } from "./_headerMetrics";

type MergedEvent =
    | (SpecialEvent & { source: "builtin" })
    | {
        source: "custom";
        id: string;
        title: string;
        date: string;
        isYearly: boolean;
        iconName: string;
        raw: SpecialDay;
    };

export default function EventsScreen() {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const { state } = useAuth();
    const { profile, partner } = state;
    const hasPartnerUser = !!partner?.id;
    const showSpecialDaysAutoHint =
        !hasPartnerUser ||
        !partner?.birth_date ||
        !profile?.relationship_start_date;

    const {
        specialDays,
        loading,
        hasPartner,
        addSpecialDay,
        editSpecialDay,
        removeSpecialDay,
    } = useSpecialDays();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editing, setEditing] = useState<SpecialDay | null>(null);

    const modalVisible = addModalOpen || editing != null;

    const builtinEvents = useMemo((): (SpecialEvent & { source: "builtin" })[] => {
        const year = new Date().getFullYear();
        const fixed: (SpecialEvent & { source: "builtin" })[] = [
            {
                id: "builtin-valentines",
                source: "builtin",
                title: t("home.valentines"),
                date: `${year}-02-14`,
                isYearly: true,
                iconName: "heart",
            },
            {
                id: "builtin-newyear",
                source: "builtin",
                title: t("home.newYear"),
                date: `${year}-01-01`,
                isYearly: true,
                iconName: "sparkles",
            },
        ];

        const fromProfile: (SpecialEvent & { source: "builtin" })[] = [];
        if (partner?.birth_date) {
            fromProfile.push({
                id: "derived-partner-birth",
                source: "builtin",
                title: t("home.birthday"),
                date: partner.birth_date,
                isYearly: true,
                iconName: "gift",
            });
        }
        if (profile?.relationship_start_date) {
            fromProfile.push({
                id: "derived-anniversary",
                source: "builtin",
                title: t("home.anniversary"),
                date: profile.relationship_start_date,
                isYearly: true,
                iconName: "calendar",
            });
        }

        return [...fromProfile, ...fixed];
    }, [partner?.birth_date, profile?.relationship_start_date, t, i18n.language]);

    const customEvents = useMemo((): MergedEvent[] => {
        return specialDays.map((s) => ({
            source: "custom" as const,
            id: s.id,
            title: s.title,
            date: s.special_date,
            isYearly: true,
            iconName: iconNameForSpecialDayId(s.id),
            raw: s,
        }));
    }, [specialDays]);

    const mergedSorted = useMemo(() => {
        const merged: MergedEvent[] = [...builtinEvents, ...customEvents];
        return merged.sort(
            (a, b) =>
                calculateDaysRemaining(a.date, a.isYearly) -
                calculateDaysRemaining(b.date, b.isYearly)
        );
    }, [builtinEvents, customEvents]);

    const closeModal = useCallback(() => {
        setAddModalOpen(false);
        setEditing(null);
    }, []);

    const openAdd = useCallback(() => {
        if (!hasPartner) {
            Alert.alert(
                "Partner gerekli",
                "Özel gün eklemek için önce partnerinle eşleşmen gerekiyor."
            );
            return;
        }
        setEditing(null);
        setAddModalOpen(true);
    }, [hasPartner]);

    const onLongPressCustom = useCallback((item: Extract<MergedEvent, { source: "custom" }>) => {
        Alert.alert(item.title, undefined, [
            {
                text: "Düzenle",
                onPress: () => setEditing(item.raw),
            },
            {
                text: "Sil",
                style: "destructive",
                onPress: () => {
                    Alert.alert("Özel günü sil", "Bu özel gün kalıcı olarak silinsin mi?", [
                        { text: "Vazgeç", style: "cancel" },
                        {
                            text: "Sil",
                            style: "destructive",
                            onPress: () => removeSpecialDay(item.raw.id).catch((e) => {
                                Alert.alert("Hata", e instanceof Error ? e.message : "Silinemedi.");
                            }),
                        },
                    ]);
                },
            },
            { text: "İptal", style: "cancel" },
        ]);
    }, [removeSpecialDay]);

    const handleModalSubmit = useCallback(
        async (data: { title: string; special_date: string }) => {
            if (editing) {
                await editSpecialDay(editing.id, data.title, data.special_date);
            } else {
                await addSpecialDay(data.title, data.special_date);
            }
        },
        [editing, addSpecialDay, editSpecialDay]
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View
                    style={{
                        width: HEADER_HIT,
                        height: HEADER_HIT,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <TouchableOpacity
                        onPress={openAdd}
                        disabled={!hasPartner}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel="Add special day"
                        style={{
                            width: HEADER_HIT,
                            height: HEADER_HIT,
                            minHeight: HEADER_HIT,
                            maxHeight: HEADER_HIT,
                            borderRadius: HEADER_HIT / 2,
                            alignItems: "center",
                            justifyContent: "center",
                            alignSelf: "center",
                            opacity: hasPartner ? 1 : 0.35,
                        }}
                    >
                        <Ionicons name="add" size={24} color="#F43F5E" />
                    </TouchableOpacity>
                </View>
            ),
            headerRightContainerStyle: {
                paddingRight: 10,
            },
        });
    }, [navigation, openAdd, hasPartner]);

    return (
        <View className="flex-1 bg-[#FDF8F7]">
            {loading ? (
                <View className="flex-1 items-center justify-center py-20">
                    <ActivityIndicator size="large" color="#F43F5E" />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 48 }}
                >
                    {showSpecialDaysAutoHint && (
                        <View className="mb-4">
                            <View className="flex-row items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/80 px-4 py-3">
                                <Ionicons
                                    name="information-circle-outline"
                                    size={22}
                                    color="#F43F5E"
                                    style={{ marginTop: 1 }}
                                />
                                <Text className="flex-1 text-slate-600 text-[13px] leading-5">
                                    {t("home.specialDaysUnmatchedHint")}
                                </Text>
                            </View>
                        </View>
                    )}
                    <View className="gap-3">
                        {mergedSorted.map((event) => (
                            <Pressable
                                key={event.id}
                                onLongPress={
                                    event.source === "custom"
                                        ? () => onLongPressCustom(event)
                                        : undefined
                                }
                                delayLongPress={400}
                            >
                                <SpecialDayCard
                                    title={event.title}
                                    date={event.date}
                                    isYearly={event.isYearly}
                                    iconName={event.iconName}
                                />
                            </Pressable>
                        ))}
                    </View>
                </ScrollView>
            )}

            <AddSpecialDayModal
                visible={modalVisible}
                onClose={closeModal}
                formKey={editing?.id ?? (addModalOpen ? "create" : "idle")}
                initialValues={
                    editing
                        ? { title: editing.title, special_date: editing.special_date }
                        : null
                }
                onSubmit={handleModalSubmit}
            />
        </View>
    );
}
