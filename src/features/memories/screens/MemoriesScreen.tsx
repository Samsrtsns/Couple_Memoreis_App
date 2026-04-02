import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import React, { useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationState, SceneMap, SceneRendererProps, TabView } from "react-native-tab-view";

import { AddMemoryModal } from "../components/AddMemoryModal";
import { MemoriesEmptyState } from "../components/MemoriesEmptyState";
import { MemoryCard } from "../components/MemoryCard";
import { MemoryCardSkeleton } from "../components/MemoryCardSkeleton";
import { useMemories } from "../hooks/useMemories";
import type { Memory } from "../types/memory.types";

// Header
function ScreenHeader({
    onAddPress,
    hasPartner,
    title = "Memory Timeline",
    subtitle = "Your love story, chapter by chapter",
}: {
    onAddPress: () => void;
    hasPartner: boolean;
    title?: string;
    subtitle?: string;
}) {
    return (
        <View className="flex-row items-center justify-between px-5 pt-4 pb-4 bg-bgLight">
            <View>
                <Text className="text-[26px] font-extrabold text-[#2d1020] tracking-tight">
                    {title}
                </Text>
                <Text className="text-[13px] text-[#c084a0] italic">
                    {subtitle}
                </Text>
            </View>

            {hasPartner && (
                <TouchableOpacity
                    onPress={onAddPress}
                    activeOpacity={0.85}
                    className="w-[42px] h-[42px] rounded-full bg-[#FF8A8A] items-center justify-center shadow-lg"
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

// Albums Placeholder
function AlbumsScreen({ hasPartner, onAddPress }: { hasPartner: boolean; onAddPress: () => void }) {
    return (
        <View className="flex-1 items-center justify-center bg-bgLight px-5">
            <View className="w-20 h-20 bg-[#fde8ef] rounded-full items-center justify-center mb-4">
                <Ionicons name="images-outline" size={40} color="#FF8A8A" />
            </View>
            <Text className="text-[20px] font-bold text-[#2d1020] mb-2">Memory Albums</Text>
            <Text className="text-[#9e6070] text-center mb-6 text-[15px]">
                Organize your memories into beautiful albums for different occasions and adventures.
            </Text>
            {hasPartner && (
                <TouchableOpacity
                    onPress={onAddPress}
                    className="bg-[#FF8A8A] px-6 py-3 rounded-full shadow-md"
                >
                    <Text className="text-white font-bold">Create New Album</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function MemoriesScreen() {
    const layout = useWindowDimensions();
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

    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: "timeline", title: "Timeline" },
        { key: "albums", title: "Albums" },
    ]);

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

    const renderTimeline = () => (
        <View className="flex-1 w-full">
            <FlashList
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
                        onAddMemory={
                            hasPartner ? () => setModalVisible(true) : undefined
                        }
                    />
                }
                ListFooterComponent={
                    loading && memories.length > 0 ? (
                        <ActivityIndicator
                            color="#e91e8c"
                            style={{ paddingVertical: 20 }}
                        />
                    ) : null
                }
                contentContainerStyle={{
                    paddingBottom: 100,
                    flexGrow: memories.length === 0 ? 1 : undefined,
                }}
            />
        </View>
    );

    const renderScene = SceneMap({
        timeline: renderTimeline,
        albums: () => (
            <AlbumsScreen
                hasPartner={hasPartner}
                onAddPress={() => setModalVisible(true)}
            />
        ),
    });

    const renderTabBar = (props: SceneRendererProps & { navigationState: NavigationState<{ key: string; title: string }> }) => (
        <View className="px-5 pb-2 bg-bgLight">
            <View className="flex-row items-center bg-[#f3f3f4] rounded-[20px] p-1">
                {props.navigationState.routes.map((route, i) => {
                    const isSelected = index === i;
                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => setIndex(i)}
                            activeOpacity={0.7}
                            className={`flex-1 items-center justify-center py-2.5 rounded-[18px] ${isSelected ? "bg-[#fde8ef]" : "bg-transparent"
                                }`}
                        >
                            <Text
                                className={`text-[14px] font-bold ${isSelected ? "text-[#e91e8c]" : "text-[#9e6070]"
                                    }`}
                            >
                                {route.title}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // Loading
    if (loading && memories.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-bgLight" edges={["top"]}>
                <ScreenHeader
                    onAddPress={() => setModalVisible(true)}
                    hasPartner={false}
                />

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
                <ScreenHeader
                    onAddPress={() => setModalVisible(true)}
                    hasPartner={hasPartner}
                />

                <View className="flex-1 items-center justify-center px-8 gap-3">
                    <Ionicons name="warning-outline" size={48} color="#f48fb1" />

                    <Text className="text-[20px] font-bold text-[#2d1020]">
                        Something went wrong
                    </Text>

                    <Text className="text-[14px] text-[#9e6070] text-center">
                        {error}
                    </Text>

                    <TouchableOpacity
                        onPress={refresh}
                        className="mt-2 bg-[#e91e8c] rounded-full px-7 py-3"
                    >
                        <Text className="text-white font-bold text-[15px]">Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-bgLight" edges={["top"]}>
            <AddMemoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleAddMemory}
            />

            <ScreenHeader
                onAddPress={() => setModalVisible(true)}
                hasPartner={hasPartner}
                title={index === 0 ? "Memory Timeline" : "Memory Albums"}
                subtitle={index === 0 ? "Your love story, chapter by chapter" : "Captured moments, beautifully organized"}
            />

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={renderTabBar}
                swipeEnabled={true}
            />
        </SafeAreaView>
    );
}