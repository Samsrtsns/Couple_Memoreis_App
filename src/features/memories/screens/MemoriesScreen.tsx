/**
 * MemoriesScreen
 *
 * The main screen for the Memories Timeline feature.
 * A FlatList-driven vertical timeline of shared couple memories.
 *
 * Features:
 * - Timeline layout with left-side line + dots per card
 * - Pull-to-refresh
 * - Realtime updates (via useMemories)
 * - Floating + FAB button to open AddMemoryModal
 * - Loading skeleton, empty, and error states
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddMemoryModal } from '../components/AddMemoryModal';
import { MemoriesEmptyState } from '../components/MemoriesEmptyState';
import { MemoryCard } from '../components/MemoryCard';
import { MemoryCardSkeleton } from '../components/MemoryCardSkeleton';
import { useMemories } from '../hooks/useMemories';
import type { Memory } from '../types/memory.types';

// ─────────────────────────────────────────────
// Header component
// ─────────────────────────────────────────────

function ScreenHeader({ onAddPress, hasPartner }: { onAddPress: () => void; hasPartner: boolean }) {
    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Our Memories</Text>
                <Text style={styles.headerSubtitle}>Your love story, chapter by chapter</Text>
            </View>
            {hasPartner && (
                <TouchableOpacity style={styles.addBtn} onPress={onAddPress} activeOpacity={0.85}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────

export default function MemoriesScreen() {
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

    // ─── Pull-to-refresh ──────────────────────────────────────────
    const handleRefresh = async () => {
        setRefreshing(true);
        await refresh();
        setRefreshing(false);
    };

    // ─── Add memory handler ───────────────────────────────────────
    const handleAddMemory = async (data: {
        title: string;
        description: string;
        memory_date: string;
        photoUri: string;
    }) => {
        await addMemory({
            title: data.title,
            description: data.description,
            memory_date: data.memory_date,
            photoUri: data.photoUri,
        });
    };

    // ─── Comment handler ──────────────────────────────────────────
    const handleAddComment = async (memoryId: string, text: string) => {
        await addComment({ memory_id: memoryId, comment: text });
    };

    // ─── Render item ──────────────────────────────────────────────
    const renderItem = ({ item, index }: { item: Memory; index: number }) => (
        <MemoryCard
            memory={item}
            currentUserId={currentUserId ?? ''}
            onToggleLike={toggleLike}
            onAddComment={handleAddComment}
            isLast={index === memories.length - 1}
        />
    );

    // ─── Loading state ────────────────────────────────────────────
    if (loading && memories.length === 0) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <ScreenHeader onAddPress={() => setModalVisible(true)} hasPartner={false} />
                <View style={styles.skeletons}>
                    <MemoryCardSkeleton />
                    <MemoryCardSkeleton />
                    <MemoryCardSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    // ─── Error state ──────────────────────────────────────────────
    if (error && memories.length === 0) {
        return (
            <SafeAreaView style={styles.screen} edges={['top']}>
                <ScreenHeader onAddPress={() => setModalVisible(true)} hasPartner={hasPartner} />
                <View style={styles.centered}>
                    <Ionicons name="warning-outline" size={48} color="#f48fb1" />
                    <Text style={styles.errorTitle}>Something went wrong</Text>
                    <Text style={styles.errorMsg}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.screen} edges={['top']}>
            {/* Modal */}
            <AddMemoryModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleAddMemory}
            />

            {/* List */}
            <FlatList
                data={memories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#e91e8c"
                        colors={['#e91e8c']}
                    />
                }
                ListHeaderComponent={
                    <ScreenHeader
                        onAddPress={() => setModalVisible(true)}
                        hasPartner={hasPartner}
                    />
                }
                ListEmptyComponent={
                    <MemoriesEmptyState
                        variant={hasPartner ? 'no-memories' : 'no-partner'}
                        onAddMemory={hasPartner ? () => setModalVisible(true) : undefined}
                    />
                }
                ListFooterComponent={
                    loading && memories.length > 0 ? (
                        <ActivityIndicator color="#e91e8c" style={{ paddingVertical: 20 }} />
                    ) : null
                }
                contentContainerStyle={[
                    styles.listContent,
                    memories.length === 0 && { flex: 1 },
                ]}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff5f8',
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#2d1020',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#c084a0',
        marginTop: 2,
        fontStyle: 'italic',
    },
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#e91e8c',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#e91e8c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    // List
    listContent: {
        paddingBottom: 100,
    },
    // Loading skeletons
    skeletons: {
        flex: 1,
        paddingTop: 8,
    },
    // Error state
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2d1020',
    },
    errorMsg: {
        fontSize: 14,
        color: '#9e6070',
        textAlign: 'center',
    },
    retryBtn: {
        marginTop: 8,
        backgroundColor: '#e91e8c',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 28,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#e91e8c',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#e91e8c',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});
