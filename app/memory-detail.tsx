/**
 * Memory Detail Screen
 *
 * Shows a full-page, premium detail view for a single memory.
 * Data is passed via route params (cached) so no API re-fetch is needed.
 * 
 * Edit/Delete use service functions directly (NOT useMemories hook)
 * to avoid creating a second realtime subscription that conflicts
 * with the list screen's subscription.
 */

import { useAuth } from "@/src/context/AuthContext";
import { EditMemoryModal } from "@/src/features/memories/components/EditMemoryModal";
import {
    deleteMemory as deleteMemoryService,
    updateMemory as updateMemoryService,
    uploadMemoryPhoto,
} from "@/src/features/memories/services/memoriesService";
import type { Memory, UpdateMemoryPayload } from "@/src/features/memories/types/memory.types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

// ─────────────────────────────────────────────
// Turkish date formatting
// ─────────────────────────────────────────────
const TR_MONTHS = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatDateTurkish(dateStr: string): string {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${TR_MONTHS[month]} ${year}`;
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function MemoryDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const { data } = useLocalSearchParams<{ id: string; data: string }>();
    const { state } = useAuth();

    // Current user ID from auth context (always available, no loading needed)
    const currentUserId = state.user?.id ?? null;

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [memoryState, setMemoryState] = useState<Memory | null>(null);

    // Parse memory from route params (cached) + allow local state overrides
    const parsedMemory: Memory | null = useMemo(() => {
        if (!data) return null;
        try {
            return JSON.parse(data) as Memory;
        } catch {
            return null;
        }
    }, [data]);

    // Use local state if updated, otherwise use parsed cache
    const memory = memoryState ?? parsedMemory;

    const isCreator = !!(currentUserId && memory && memory.created_by === currentUserId);

    // ─── Handlers ────────────────────────────────────────────
    const handleEdit = () => {
        setEditModalVisible(true);
    };

    const handleEditSubmit = async (payload: UpdateMemoryPayload) => {
        if (!currentUserId) throw new Error("Not authenticated.");

        let newPhotoUrl: string | undefined;

        // Upload new photo if provided
        if (payload.photoUri) {
            newPhotoUrl = await uploadMemoryPhoto(payload.photoUri, currentUserId);
        }

        const updated = await updateMemoryService({
            memoryId: payload.memoryId,
            title: payload.title,
            description: payload.description,
            memory_date: payload.memory_date,
            photo_url: newPhotoUrl,
            currentUserId,
        });

        // Update local memory state immediately
        setMemoryState(updated);
    };

    const handleDelete = () => {
        if (!memory || !currentUserId) return;
        Alert.alert(
            "Anıyı Sil",
            "Bu anıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteMemoryService(memory.id, currentUserId);
                            // Navigate back — the list screen's realtime
                            // subscription will remove it from the timeline
                            router.back();
                        } catch (e: unknown) {
                            const msg = e instanceof Error ? e.message : "Bir hata oluştu.";
                            Alert.alert("Silme Başarısız", msg);
                        }
                    },
                },
            ]
        );
    };

    if (!memory) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.backButton, { top: insets.top + 10 }]}
                >
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </Pressable>
                <Text style={{ color: "#94A3B8", fontSize: 15 }}>Anı bulunamadı</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* BACK BUTTON (OVERLAY) */}
            <Pressable
                onPress={() => router.back()}
                style={[styles.backButton, { top: insets.top + 10 }]}
            >
                <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </Pressable>

            {/* ACTION BUTTONS (OVERLAY - only for creator) */}
            {isCreator && (
                <View style={[styles.actionButtons, { top: insets.top + 10 }]}>
                    <Pressable onPress={handleEdit} style={styles.actionBtn}>
                        <Ionicons name="pencil" size={18} color="#1E293B" />
                    </Pressable>
                    <Pressable onPress={handleDelete} style={[styles.actionBtn, styles.deleteBtn]}>
                        <Ionicons name="trash-outline" size={18} color="#F43F5E" />
                    </Pressable>
                </View>
            )}

            {/* SCROLLABLE CONTENT */}
            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* HERO IMAGE */}
                <View style={styles.heroContainer}>
                    {memory.photo_url ? (
                        <Image
                            source={{ uri: memory.photo_url }}
                            style={styles.heroImage}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.heroImage, styles.heroPlaceholder]}>
                            <Ionicons name="image-outline" size={56} color="#f4c2d8" />
                        </View>
                    )}
                </View>

                {/* TITLE & META */}
                <View style={styles.metaSection}>
                    <Text style={styles.memoryTitle}>{memory.title}</Text>

                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={14} color="#F43F5E" />
                        <Text style={styles.metaText}>
                            {formatDateTurkish(memory.memory_date)}
                        </Text>
                    </View>

                    {memory.creator_profile && (
                        <View style={styles.metaRow}>
                            <Ionicons name="person-outline" size={14} color="#F43F5E" />
                            <Text style={styles.metaText}>
                                {t("memories.detailAddedBy", {
                                    name: memory.creator_profile.first_name,
                                })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* DESCRIPTION */}
                {memory.description ? (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.descriptionText}>{memory.description}</Text>
                    </View>
                ) : null}
            </ScrollView>

            {/* EDIT MODAL */}
            {memory && (
                <EditMemoryModal
                    visible={editModalVisible}
                    memory={memory}
                    onClose={() => setEditModalVisible(false)}
                    onSubmit={handleEditSubmit}
                />
            )}
        </View>
    );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    centered: {
        alignItems: "center",
        justifyContent: "center",
    },

    // Scroll
    scroll: {
        flex: 1,
    },

    // Hero
    heroContainer: {
        width: "100%",
        height: 450,
        position: "relative",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    backButton: {
        position: "absolute",
        left: 20,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    actionButtons: {
        position: "absolute",
        right: 20,
        zIndex: 50,
        flexDirection: "row",
        gap: 8,
    },
    actionBtn: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    deleteBtn: {
        backgroundColor: "rgba(255, 240, 240, 0.95)",
    },
    heroPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fde8f0",
    },

    // Meta
    metaSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 12,
    },
    memoryTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1E293B",
        lineHeight: 32,
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    metaText: {
        fontSize: 14,
        color: "#64748B",
        fontWeight: "500",
    },

    // Description
    descriptionSection: {
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    descriptionText: {
        fontSize: 15,
        color: "#475569",
        lineHeight: 24,
    },
});
