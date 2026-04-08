import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { usePhotoUploadCountdown } from "@/src/hooks/usePhotoUploadCountdown";
import { AddMemoryModal } from "../components/AddMemoryModal";
import { MemoriesEmptyState } from "../components/MemoriesEmptyState";
import { MemoryCard } from "../components/MemoryCard";
import { MemoryCardSkeleton } from "../components/MemoryCardSkeleton";
import { useMemories } from "../hooks/useMemories";
import type { Memory } from "../types/memory.types";

function ScreenHeader({
    title = "Anı Zaman Tüneli",
    subtitle = "Aşk hikayeniz, bölüm bölüm",
}: {
    title?: string;
    subtitle?: string;
}) {
    return (
        <View className="px-5 pt-4 pb-4 bg-bgLight">
            <View>
                <Text className="text-[26px] font-extrabold text-[#2d1020] tracking-tight">
                    {title}
                </Text>
                <Text className="text-[13px] text-[#c084a0] italic">
                    {subtitle}
                </Text>
            </View>
        </View>
    );
}

export default function MemoriesScreen() {
    const insets = useSafeAreaInsets();
    const {
        memories,
        loading,
        error,
        currentUserId,
        hasPartner,
        refresh,
        addMemory,
    } = useMemories();

    const { isLocked, remainingText, isPremium } = usePhotoUploadCountdown();

    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [forceTotalLimitReached, setForceTotalLimitReached] = useState(false);

    const myMemoryCount = memories.filter((m) => m.created_by === currentUserId).length;
    const isTotalMemoryLimitReached =
        forceTotalLimitReached || (!isPremium && myMemoryCount >= 4);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    const handleAddMemory = async (data: {
        title: string;
        description: string;
        memory_date: string;
        photoUri: string;
    }) => {
        try {
            await addMemory(data);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "";
            if (msg === "MEMORY_TOTAL_LIMIT_REACHED") {
                setForceTotalLimitReached(true);
                return;
            }
            throw e;
        }
    };

    const renderItem = ({ item, index: memoryIndex }: { item: Memory; index: number }) => (
        <MemoryCard
            memory={item}
            currentUserId={currentUserId ?? ""}
            isLast={memoryIndex === memories.length - 1}
        />
    );

    if (loading && memories.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-bgLight" edges={["top"]}>
                <ScreenHeader />
                <View className="flex-1 pt-2">
                    <MemoryCardSkeleton />
                    <MemoryCardSkeleton />
                    <MemoryCardSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    if (error && memories.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-bgLight" edges={["top"]}>
                <ScreenHeader />
                <View className="flex-1 items-center justify-center px-8 gap-3">
                    <Ionicons name="warning-outline" size={48} color="#f48fb1" />
                    <Text className="text-[20px] font-bold text-[#2d1020]">
                        Bu ekranda anılarınızı biriktirip bir zaman tüneli oluşturabilirsiniz
                    </Text>
                    <Text className="text-[14px] text-[#9e6070] text-center">{error}</Text>
                    <TouchableOpacity onPress={refresh} className="mt-2 bg-[#e91e8c] rounded-full px-7 py-3">
                        <Text className="text-white font-bold text-[15px]">Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-bgLight">
            <AddMemoryModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setForceTotalLimitReached(false);
                }}
                onSubmit={handleAddMemory}
                isDailyLimitReached={isLocked}
                timeRemaining={remainingText}
                isTotalMemoryLimitReached={isTotalMemoryLimitReached}
            />

            {hasPartner && (
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.85}
                    style={{
                        position: 'absolute',
                        top: insets.top + 16,
                        right: 20,
                        zIndex: 100,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: '#FF8A8A',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#FF8A8A',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
            )}

            <SafeAreaView className="flex-1" edges={["top"]}>
                <ScreenHeader />

                <View className="flex-1 w-full">
                    <FlatList
                        data={memories}
                        keyExtractor={(item: Memory) => item.id}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor="#e91e8c"
                                colors={["#e91e8c"]}
                            />
                        }
                        ListEmptyComponent={
                            <MemoriesEmptyState
                                variant={hasPartner ? "no-memories" : "no-partner"}
                                onAddMemory={hasPartner ? () => setModalVisible(true) : undefined}
                            />
                        }
                        ListFooterComponent={
                            loading && memories.length > 0 ? (
                                <ActivityIndicator color="#e91e8c" style={{ paddingVertical: 20 }} />
                            ) : null
                        }
                        contentContainerStyle={{
                            paddingBottom: 120,
                            flexGrow: memories.length === 0 ? 1 : undefined,
                        }}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}
