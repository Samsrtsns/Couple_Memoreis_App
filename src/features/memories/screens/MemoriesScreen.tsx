import { Ionicons } from "@expo/vector-icons";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AddMemoryModal } from "../components/AddMemoryModal";
import { MemoriesEmptyState } from "../components/MemoriesEmptyState";
import { MemoryCard } from "../components/MemoryCard";
import { MemoryCardSkeleton } from "../components/MemoryCardSkeleton";
import { useMemories } from "../hooks/useMemories";
import type { Memory } from "../types/memory.types";

// Header
function ScreenHeader({
    title = "Memory Timeline",
    subtitle = "Your love story, chapter by chapter",
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
        toggleLike,
        addComment,
    } = useMemories();

    const listRef = useRef<FlashListRef<Memory>>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

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
        await addMemory(data);
        // Yeni anı eklendikten sonra listeyi en yukarı kaydır
        setTimeout(() => {
            listRef.current?.scrollToTop({ animated: true });
        }, 300);
    };

    const handleAddComment = async (memoryId: string, text: string) => {
        await addComment({ memory_id: memoryId, comment: text });
    };

    const renderItem = ({ item, index: memoryIndex }: { item: Memory; index: number }) => (
        <MemoryCard
            memory={item}
            currentUserId={currentUserId ?? ""}
            onToggleLike={toggleLike}
            onAddComment={handleAddComment}
            isLast={memoryIndex === memories.length - 1}
        />
    );

    // Loading
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

    // Error
    if (error && memories.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-bgLight" edges={["top"]}>
                <ScreenHeader />
                <View className="flex-1 items-center justify-center px-8 gap-3">
                    <Ionicons name="warning-outline" size={48} color="#f48fb1" />
                    <Text className="text-[20px] font-bold text-[#2d1020]">Something went wrong</Text>
                    <Text className="text-[14px] text-[#9e6070] text-center">{error}</Text>
                    <TouchableOpacity onPress={refresh} className="mt-2 bg-[#e91e8c] rounded-full px-7 py-3">
                        <Text className="text-white font-bold text-[15px]">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-bgLight">
            <AddMemoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleAddMemory}
            />

            {/* FIXED ADD BUTTON */}
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
                    <FlashList
                        ref={listRef}
                        data={memories}
                        keyExtractor={(item) => item.id}
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