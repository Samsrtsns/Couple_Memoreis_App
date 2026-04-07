/**
 * PlaceBottomSheet — sliding panel showing a shared place's details.
 *
 * Features:
 * - Uses react-native-modal for true top-layer display
 * - Photo preview, title, description, address, date, creator info
 * - Edit / delete buttons (if current user is the creator)
 */

import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeleteSharedPlace } from '../hooks/useDeleteSharedPlace';
import type { SharedPlace } from '../types/sharedPlace.types';
import { formatVisitedDate } from '../utils/map.utils';
import { canDeletePlace } from '../utils/pair.utils';

type Props = {
    place: SharedPlace | null;
    partnerName?: string;
    onClose: () => void;
    onPlaceDeleted: (placeId: string) => void;
};

export default function PlaceBottomSheet({
    place,
    partnerName,
    onClose,
    onPlaceDeleted,
}: Props) {
    const insets = useSafeAreaInsets();
    const { state } = useAuth();
    const currentUserId = state.user?.id ?? '';

    const { remove: removePlace, loading: deletingPlace } = useDeleteSharedPlace(
        onPlaceDeleted
    );

    const handleDeletePlace = () => {
        if (!place) return;
        Alert.alert(
            'Yeri Sil',
            `"${place.title}" silinsin mi? Bu işlem geri alınamaz.`,
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await removePlace(place.id);
                        onClose();
                    },
                },
            ]
        );
    };

    const isCreator = place ? canDeletePlace(place, currentUserId) : false;

    const screenHeight = Dimensions.get('window').height;
    const cardMaxHeight = screenHeight * 0.85;

    return (
        <Modal
            isVisible={!!place}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            onSwipeComplete={onClose}
            swipeDirection={['down']}
            propagateSwipe
            style={{ margin: 0, justifyContent: 'flex-end' }}
            backdropOpacity={0.4}
            useNativeDriverForBackdrop
            avoidKeyboard={true}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <View
                    style={[
                        styles.card,
                        { paddingBottom: Math.max(insets.bottom, 16), maxHeight: cardMaxHeight }
                    ]}
                >
                    {/* Handle */}
                    <View style={styles.handleWrapper}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                        style={{ flexGrow: 0 }}
                        nestedScrollEnabled={true}
                        bounces={true}
                    >
                        {/* Optional Photo */}
                        {place?.photo_url && (
                            <Image
                                source={{ uri: place.photo_url }}
                                style={styles.photo}
                                contentFit="cover"
                                transition={200}
                                cachePolicy="memory-disk"
                            />
                        )}

                        {/* Top row: info + actions */}
                        <View style={styles.topRow}>
                            <View style={styles.info}>
                                <Text style={styles.title} numberOfLines={2}>
                                    {place?.title}
                                </Text>

                                {place?.address && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="location-outline" size={12} color="#94A3B8" />
                                        <Text style={styles.metaText} numberOfLines={1}>
                                            {place.address}
                                        </Text>
                                    </View>
                                )}

                                {place?.visited_at && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                                        <Text style={styles.metaText}>
                                            {formatVisitedDate(place.visited_at)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-row items-center gap-4">
                                {isCreator && (
                                    <Pressable
                                        onPress={handleDeletePlace}
                                        style={[styles.actionBtn, styles.deleteBtn]}
                                        disabled={deletingPlace}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                                    </Pressable>
                                )}
                                <Pressable onPress={onClose} style={styles.actionBtn}>
                                    <Ionicons name="close" size={18} color="#64748B" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Description */}
                        {place?.description && (
                            <Text style={styles.descriptionText}>
                                {place.description}
                            </Text>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.creatorRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#94A3B8" />
                            <Text style={styles.creatorText}>
                                {place?.created_by === currentUserId
                                    ? 'Senin eklediğin'
                                    : partnerName
                                        ? `${partnerName} tarafından eklendi`
                                        : 'Partnerinin eklediği'}
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -8 },
        elevation: 20,
    },
    handleWrapper: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    topRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    info: {
        flex: 1,
        paddingTop: 2,
        gap: 4,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1E293B',
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    descriptionText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginTop: 12,
    },
    photo: {
        width: '100%',
        height: 260,
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: '#F1F5F9',
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    deleteBtn: {
        backgroundColor: '#FFF1F2',
        borderColor: '#FDA4AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    creatorText: {
        fontSize: 12,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
});
