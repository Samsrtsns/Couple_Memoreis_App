import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
    isLast: boolean;
};

function firstNameOnly(first?: string | null): string | null {
    const f = first?.trim() ?? '';
    return f.length > 0 ? f : null;
}

export function MemoryCard({ memory, currentUserId, isLast }: Props) {
    const { t } = useTranslation();
    const router = useRouter();
    const { state } = useAuth();
    const profile = state.profile;
    const partner = state.partner;

    const creatorDisplayName = useMemo(() => {
        const fromCreator = firstNameOnly(memory.creator_profile?.first_name);
        if (fromCreator) return fromCreator;

        if (memory.created_by === currentUserId) {
            return firstNameOnly(profile?.first_name) ?? '';
        }
        return firstNameOnly(partner?.first_name) ?? '';
    }, [memory, currentUserId, profile, partner]);

    const addedByLabel =
        creatorDisplayName.trim().length > 0
            ? creatorDisplayName
            : t('memories.addedByFallbackName');

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
                                numberOfLines={2}
                            >
                                {memory.description}
                            </Text>
                        </View>
                    ) : null}

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.createdBy}>
                            {t('memories.addedBy', { name: addedByLabel })}
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

    footer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginTop: 2,
    },

    createdBy: {
        fontSize: 12,
        color: '#d4a0b8',
        fontStyle: 'italic',
    },
});