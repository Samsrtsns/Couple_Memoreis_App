/**
 * PlaceBottomSheet — sliding panel showing a shared place's details + comments.
 *
 * Features:
 * - Animated slide-up / slide-down
 * - Photo preview, title, description, address, date, creator info
 * - Comments list with chat-style bubbles
 * - Comment input at the bottom
 * - Edit / delete buttons (if current user is the creator)
 */

import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
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
    const { state } = useAuth();
    const currentUserId = state.profile?.id ?? '';

    // Animation values
    const slideAnim = useRef(new Animated.Value(400)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    // Snapshot holds the last non-null place so card can animate out with content
    const [snapshot, setSnapshot] = useState<SharedPlace | null>(null);
    // Track if current user already has a comment on this place
    const [alreadyCommented, setAlreadyCommented] = useState(false);

    useEffect(() => {
        if (place) {
            setSnapshot(place);
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 22,
                    stiffness: 200,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 400,
                    duration: 240,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start(() => setSnapshot(null));
        }
    }, [place]);

    // Comments
    const {
        comments,
        loading: commentsLoading,
        error: commentsError,
        refetch: refetchComments,
    } = usePlaceComments(snapshot?.id ?? null);

    // Re-check if user already commented whenever comments list changes
    useEffect(() => {
        if (!snapshot?.id || !currentUserId) { setAlreadyCommented(false); return; }
        hasUserCommented(snapshot.id, currentUserId).then(setAlreadyCommented);
    }, [snapshot?.id, currentUserId, comments.length]);

    // Create comment — use a ref for refetch so useCallback doesn't re-create
    const refetchRef = useRef(refetchComments);
    useEffect(() => { refetchRef.current = refetchComments; }, [refetchComments]);

    const onCommentCreated = useCallback(() => {
        refetchRef.current();
        setAlreadyCommented(true);
    }, []); // stable — no deps

    const { submit: submitComment, loading: submitLoading, error: submitError } =
        useCreatePlaceComment(onCommentCreated);

    // Delete place
    const { remove: removePlace, loading: deletingPlace } = useDeleteSharedPlace(
        onPlaceDeleted
    );

    const handleDeletePlace = () => {
        if (!snapshot) return;
        Alert.alert(
            'Delete Place',
            `Are you sure you want to delete "${snapshot.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await removePlace(snapshot.id);
                        onClose();
                    },
                },
            ]
        );
    };

    // Comment delete — call service directly to avoid stale-closure bugs
    const [deletingComment, setDeletingComment] = useState(false);
    const handleDeleteComment = (commentId: string) => {
        Alert.alert('Delete Comment', 'Remove this memory note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (!currentUserId) return;
                    setDeletingComment(true);
                    try {
                        await deleteComment(commentId, currentUserId);
                        // Optimistically remove from local list; realtime will also fire
                        refetchRef.current();
                    } catch (e: any) {
                        Alert.alert('Error', e.message ?? 'Could not delete comment.');
                    } finally {
                        setDeletingComment(false);
                    }
                },
            },
        ]);
    };

    const handleSubmitComment = async (text: string) => {
        if (!snapshot) return;
        await submitComment({ place_id: snapshot.id, comment: text });
    };

    if (!snapshot) return null;

    const isCreator = canDeletePlace(snapshot, currentUserId);

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
            ]}
            pointerEvents={place ? 'box-none' : 'none'}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.card}>
                    {/* Drag Handle */}
                    <View style={styles.handleWrapper}>
                        <View style={styles.handle} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                        nestedScrollEnabled={true}
                        scrollEnabled={true}
                    >
                        {/* Top row: image + info + actions */}
                        <View style={styles.topRow}>
                            {/* Thumbnail */}
                            {snapshot.photo_url ? (
                                <Image
                                    source={{ uri: snapshot.photo_url }}
                                    style={styles.thumbnail}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.thumbnailPlaceholder}>
                                    <Ionicons name="heart" size={28} color="#F43F5E" />
                                </View>
                            )}

                            {/* Info */}
                            <View style={styles.info}>
                                <Text style={styles.title} numberOfLines={2}>
                                    {snapshot.title}
                                </Text>
                                {snapshot.visited_at && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
                                        <Text style={styles.metaText}>
                                            {formatVisitedDate(snapshot.visited_at)}
                                        </Text>
                                    </View>
                                )}
                                {snapshot.address && (
                                    <View style={styles.metaRow}>
                                        <Ionicons name="location-outline" size={12} color="#94A3B8" />
                                        <Text style={styles.metaText} numberOfLines={1}>
                                            {snapshot.address}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Actions column */}
                            <View style={styles.actionsCol}>
                                <Pressable onPress={onClose} style={styles.actionBtn}>
                                    <Ionicons name="close" size={18} color="#64748B" />
                                </Pressable>
                                {isCreator && (
                                    <Pressable
                                        onPress={handleDeletePlace}
                                        style={[styles.actionBtn, styles.deleteBtn]}
                                        disabled={deletingPlace}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        {/* Description */}
                        {snapshot.description ? (
                            <>
                                <View style={styles.divider} />
                                <Text style={styles.description}>{snapshot.description}</Text>
                            </>
                        ) : null}

                        {/* Creator tag */}
                        <View style={styles.divider} />
                        <View style={styles.creatorRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#94A3B8" />
                            <Text style={styles.creatorText}>
                                {snapshot.created_by === currentUserId
                                    ? 'Added by you'
                                    : partnerName
                                        ? `Added by ${partnerName}`
                                        : 'Added by your partner'}
                            </Text>
                        </View>

                        {/* Comments section */}
                        <Text style={styles.sectionLabel}>OUR MEMORIES</Text>

                        <CommentsList
                            comments={comments}
                            loading={commentsLoading}
                            error={commentsError}
                            currentUserId={currentUserId}
                            onDeleteComment={handleDeleteComment}
                        />

                        {/* Comment input — disabled if user already commented */}
                        <View style={styles.inputWrapper}>
                            {alreadyCommented ? (
                                <View style={styles.alreadyCommentedRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#94A3B8" />
                                    <Text style={styles.alreadyCommentedText}>
                                        You've already added your memory note here
                                    </Text>
                                </View>
                            ) : (
                                <CommentInput
                                    onSubmit={handleSubmitComment}
                                    loading={submitLoading}
                                    error={submitError}
                                />
                            )}
                        </View>
                    </ScrollView>
                </View>{/* end card */}
            </KeyboardAvoidingView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
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
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#FFE4E6',
    },
    thumbnailPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: '#FFE4E6',
        alignItems: 'center',
        justifyContent: 'center',
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
    actionsCol: {
        gap: 8,
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
    description: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
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
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 6,
        marginBottom: 12,
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
});
