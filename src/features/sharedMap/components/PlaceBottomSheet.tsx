/**
 * PlaceBottomSheet — sliding panel showing a shared place's details + comments.
 *
 * Features:
 * - Uses react-native-modal for true top-layer display
 * - Photo preview, title, description, address, date, creator info
 * - Comments list with chat-style bubbles
 * - Comment input at the bottom
 * - Edit / delete buttons (if current user is the creator)
 */

import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
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
import { useCreatePlaceComment } from '../hooks/useCreatePlaceComment';
import { useDeleteSharedPlace } from '../hooks/useDeleteSharedPlace';
import { usePlaceComments } from '../hooks/usePlaceComments';
import {
    deleteComment,
    hasUserCommented,
} from '../services/placeCommentsService';
import type { SharedPlace } from '../types/sharedPlace.types';
import { formatVisitedDate } from '../utils/map.utils';
import { canDeletePlace } from '../utils/pair.utils';
import CommentInput from './CommentInput';
import CommentsList from './CommentsList';

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

    // Track if current user already has a comment on this place
    const [alreadyCommented, setAlreadyCommented] = useState(false);

    // Comments fetch and realtime sync
    const {
        comments,
        loading: commentsLoading,
        error: commentsError,
        refetch: refetchComments,
        removeCommentOptimistically,
    } = usePlaceComments(place?.id ?? null);

    // Re-check if user already commented whenever comments list changes
    useEffect(() => {
        if (!place?.id || !currentUserId) { setAlreadyCommented(false); return; }
        hasUserCommented(place.id, currentUserId).then(setAlreadyCommented);
    }, [place?.id, currentUserId, comments.length]);

    // Create comment
    const onCommentCreated = useCallback(() => {
        refetchComments();
        setAlreadyCommented(true);
    }, [refetchComments]);

    const { submit: submitComment, loading: submitLoading, error: submitError } =
        useCreatePlaceComment(onCommentCreated);

    // Delete place
    const { remove: removePlace, loading: deletingPlace } = useDeleteSharedPlace(
        onPlaceDeleted
    );

    const handleDeletePlace = () => {
        if (!place) return;
        Alert.alert(
            'Delete Place',
            `Are you sure you want to delete "${place.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await removePlace(place.id);
                        onClose();
                    },
                },
            ]
        );
    };

    // Comment Edit/Delete state
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

    const handleDeleteComment = (commentId: string) => {
        Alert.alert('Delete Comment', 'Remove this memory note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!currentUserId) return;
                    setDeletingCommentId(commentId);
                    try {
                        await deleteComment(commentId, currentUserId);
                        removeCommentOptimistically(commentId);
                        setAlreadyCommented(false);
                    } catch (e: any) {
                        console.error('Delete error', e);
                        Alert.alert('Error', e.message ?? 'Could not delete comment.');
                        refetchComments();
                    } finally {
                        setDeletingCommentId(null);
                    }
                },
            },
        ]);
    };

    const handleEditComment = (commentId: string) => {
        setEditingCommentId(commentId);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
    };

    const handleSubmitComment = async (text: string) => {
        if (!place || !currentUserId) return;

        if (editingCommentId) {
            try {
                const { updateComment } = require('../services/placeCommentsService');
                await updateComment(editingCommentId, { comment: text }, currentUserId);
                setEditingCommentId(null);
                refetchComments();
            } catch (e: any) {
                Alert.alert('Error', e.message ?? 'Could not update comment.');
            }
        } else {
            await submitComment({ place_id: place.id, comment: text });
            Keyboard.dismiss();
        }
    };

    const isCreator = place ? canDeletePlace(place, currentUserId) : false;
    const editingComment = comments.find((c) => c.id === editingCommentId);

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
                        { paddingBottom: Math.max(insets.bottom, 16) }
                    ]}
                >
                    {/* Handle */}
                    <View style={styles.handleWrapper}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                        nestedScrollEnabled={true}
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
                        
                        <View style={styles.creatorRow} className="mb-4">
                            <Ionicons name="person-circle-outline" size={14} color="#94A3B8" />
                            <Text style={styles.creatorText}>
                                {place?.created_by === currentUserId
                                    ? 'Added by you'
                                    : partnerName
                                        ? `Added by ${partnerName}`
                                        : 'Added by your partner'}
                            </Text>
                        </View>

                        {/* Comments Section */}
                        <CommentsList
                            comments={comments}
                            loading={commentsLoading}
                            error={commentsError}
                            currentUserId={currentUserId}
                            deletingCommentId={deletingCommentId}
                            onDeleteComment={handleDeleteComment}
                            onEditComment={handleEditComment}
                        />

                        {/* Comment input area */}
                        <View style={styles.inputWrapper}>
                            {editingCommentId ? (
                                <View>
                                    <View style={styles.editingHeader}>
                                        <Text style={styles.editingText}>Editing your memory note</Text>
                                        <Pressable onPress={handleCancelEdit} hitSlop={10}>
                                            <Ionicons name="close-circle" size={16} color="#94A3B8" />
                                        </Pressable>
                                    </View>
                                    <CommentInput
                                        key={`edit-${editingCommentId}`}
                                        initialValue={editingComment?.comment}
                                        onSubmit={handleSubmitComment}
                                        loading={submitLoading}
                                        error={submitError}
                                    />
                                </View>
                            ) : alreadyCommented ? (
                                <View style={styles.alreadyCommentedRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#94A3B8" />
                                    <Text style={styles.alreadyCommentedText}>
                                        You've already added your memory note here
                                    </Text>
                                </View>
                            ) : (
                                <CommentInput
                                    key="new-comment"
                                    onSubmit={handleSubmitComment}
                                    loading={submitLoading}
                                    error={submitError}
                                />
                            )}
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
        maxHeight: 520,
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
        height: 160,
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
    inputWrapper: {
        marginTop: 12,
    },
    alreadyCommentedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    alreadyCommentedText: {
        fontSize: 13,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    editingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    editingText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
});
