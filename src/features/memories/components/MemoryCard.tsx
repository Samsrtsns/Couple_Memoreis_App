import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { Memory } from '../types/memory.types';
import { formatMemoryDate } from '../utils/date.utils';

type Props = {
    memory: Memory;
    currentUserId: string;
    onToggleLike: (memoryId: string) => Promise<void>;
    onAddComment: (memoryId: string, text: string) => Promise<void>;
    isLast: boolean;
};

export function MemoryCard({ memory, isLast }: Props) {
    const [descExpanded, setDescExpanded] = useState(false);
    const DESCRIPTION_LIMIT = 120;
    const isLongDesc = (memory.description?.length ?? 0) > DESCRIPTION_LIMIT;
    const router = useRouter();

    const handlePress = () => {
        router.push({
            pathname: "/memory-detail",
            params: { id: memory.id, data: JSON.stringify(memory) },
        });
    };

    return (
        <View style={styles.row}>
            {/* Timeline column */}
            <View style={styles.timelineCol}>
                <View style={styles.dot} />
                {!isLast && <View style={styles.line} />}
            </View>

            {/* Shadow wrapper */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePress}
                style={styles.cardShadow}
            >
                <View style={styles.card}>
                    {/* IMAGE HEADER */}
                    <View style={styles.imageContainer}>
                        {memory.photo_url ? (
                            <Image
                                source={{ uri: memory.photo_url }}
                                style={styles.photo}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={[styles.photo, styles.photoPlaceholder]}>
                                <Ionicons name="image-outline" size={40} color="#f4c2d8" />
                            </View>
                        )}

                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.45)']}
                            style={styles.gradient}
                        />

                        <View style={styles.overlayText}>
                            <Text style={styles.dateLabel}>
                                {formatMemoryDate(memory.memory_date)}
                            </Text>

                            <Text style={styles.title}>
                                {memory.title}
                            </Text>
                        </View>
                    </View>

                    {/* DESCRIPTION */}
                    {memory.description ? (
                        <View style={styles.descriptionContainer}>
                            <Text
                                style={styles.description}
                                numberOfLines={descExpanded || !isLongDesc ? undefined : 3}
                            >
                                {memory.description}
                            </Text>

                            {isLongDesc && (
                                <TouchableOpacity onPress={() => setDescExpanded(v => !v)}>
                                    <Text style={styles.readMore}>
                                        {descExpanded ? 'Read less ↑' : 'Read more ↓'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null}

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.createdBy}>
                            ✨ {memory.creator_profile?.first_name ?? 'Partner'} added
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 4,
    },

    timelineCol: {
        width: 28,
        alignItems: 'center',
        paddingTop: 6,
    },

    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FF8A8A',
        borderWidth: 2,
        borderColor: '#fff',
        zIndex: 1,
    },

    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#FF8A8A',
        marginTop: 4,
        marginBottom: -4,
    },

    cardShadow: {
        flex: 1,
        marginLeft: 12,
        marginBottom: 20,
        borderRadius: 20,
        backgroundColor: 'transparent',
        shadowColor: '#FF8A8A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        elevation: 10,
    },

    card: {
        flex: 1,
        backgroundColor: '#FDF8F7',
        borderRadius: 20,
        overflow: 'hidden',
    },

    imageContainer: {
        width: '100%',
        height: 260,
        position: 'relative',
    },

    photo: {
        width: '100%',
        height: '100%',
    },

    photoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fde8f0',
    },

    gradient: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '60%',
    },

    overlayText: {
        position: 'absolute',
        bottom: 14,
        left: 16,
        right: 16,
    },

    dateLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        color: '#fff',
        marginBottom: 4,
        opacity: 0.9,
    },

    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 24,
    },

    descriptionContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },

    description: {
        fontSize: 14,
        color: '#5a3040',
        lineHeight: 21,
    },

    readMore: {
        fontSize: 13,
        color: '#e91e8c',
        fontWeight: '600',
        marginTop: 4,
    },

    footer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginTop: 6,
    },

    createdBy: {
        fontSize: 12,
        color: '#d4a0b8',
        fontStyle: 'italic',
    },
});