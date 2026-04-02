/**
 * CommentsList — renders all comments for a shared place.
 *
 * Visually distinguishes current user's comments (right, rose bubble)
 * from partner's comments (left, indigo bubble).
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import type { PlaceComment } from '../types/sharedPlace.types';
import { formatCommentTime } from '../utils/map.utils';

type Props = {
    comments: PlaceComment[];
    loading: boolean;
    error: string | null;
    currentUserId: string;
    deletingCommentId?: string | null;
    onDeleteComment?: (commentId: string) => void;
    onEditComment?: (commentId: string, currentText: string) => void;
};

function CommentsList({
    comments,
    loading,
    error,
    currentUserId,
    deletingCommentId,
    onDeleteComment,
    onEditComment,
}: Props) {
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color="#F43F5E" size="small" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (comments.length === 0) {
        return (
            <View style={styles.emptyWrapper}>
                <Ionicons name="chatbubble-outline" size={28} color="#CBD5E1" />
                <Text style={styles.emptyText}>No memories yet. Be the first! 💬</Text>
            </View>
        );
    }

    return (
        <View>
            {comments.map((comment) => {
                const isOwn = comment.user_id === currentUserId;
                const authorName = comment.author
                    ? `${comment.author.first_name} ${comment.author.last_name}`
                    : isOwn
                        ? 'You'
                        : 'Partner';

                return (
                    <View
                        key={comment.id}
                        style={[
                            styles.commentRow,
                            isOwn ? styles.commentRowRight : styles.commentRowLeft,
                        ]}
                    >
                        {/* Avatar placeholder */}
                        <View style={[styles.avatar, isOwn ? styles.avatarOwn : styles.avatarPartner]}>
                            <Text style={styles.avatarText}>
                                {comment.author
                                    ? comment.author.first_name[0].toUpperCase()
                                    : isOwn
                                        ? 'Y'
                                        : 'P'}
                            </Text>
                        </View>

                        {/* Bubble */}
                        <View
                            style={[
                                styles.bubble,
                                isOwn ? styles.bubbleOwn : styles.bubblePartner,
                            ]}
                        >
                            <View style={styles.bubbleHeader}>
                                <Text style={[styles.authorName, isOwn ? styles.authorOwn : styles.authorPartner]}>
                                    {isOwn ? 'You' : authorName}
                                </Text>
                                <Text style={styles.timestamp}>
                                    {formatCommentTime(comment.created_at)}
                                </Text>
                            </View>
                            <Text style={styles.commentText}>{comment.comment}</Text>

                            {/* Actions — always shown for own comments */}
                            {isOwn && (
                                <View style={styles.actionsRow}>
                                    {onEditComment && (
                                        <TouchableOpacity
                                            onPress={() => onEditComment(comment.id, comment.comment)}
                                            style={styles.actionBtn}
                                            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
                                            activeOpacity={0.6}
                                        >
                                            <Ionicons name="pencil-outline" size={13} color="#94A3B8" />
                                        </TouchableOpacity>
                                    )}
                                    {onDeleteComment && (
                                        <TouchableOpacity
                                            onPress={() => onDeleteComment(comment.id)}
                                            style={styles.actionBtn}
                                            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
                                            activeOpacity={0.6}
                                        >
                                            {deletingCommentId === comment.id ? (
                                                <ActivityIndicator color="#F43F5E" size="small" />
                                            ) : (
                                                <Ionicons name="trash-outline" size={13} color="#F43F5E" />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

export default memo(CommentsList);

const styles = StyleSheet.create({
    centered: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 13,
        color: '#F43F5E',
        textAlign: 'center',
    },
    emptyWrapper: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 12,
    },
    commentRowRight: {
        flexDirection: 'row-reverse',
    },
    commentRowLeft: {
        flexDirection: 'row',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarOwn: {
        backgroundColor: '#FFE4E6',
        borderWidth: 2,
        borderColor: '#FDA4AF',
    },
    avatarPartner: {
        backgroundColor: '#EEF2FF',
        borderWidth: 2,
        borderColor: '#A5B4FC',
    },
    avatarText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    bubble: {
        flex: 1,
        maxWidth: '80%',
        borderRadius: 16,
        padding: 12,
        position: 'relative',
    },
    bubbleOwn: {
        backgroundColor: '#FFF1F2',
        borderBottomRightRadius: 4,
    },
    bubblePartner: {
        backgroundColor: '#F0F4FF',
        borderBottomLeftRadius: 4,
    },
    bubbleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    authorName: {
        fontSize: 11,
        fontWeight: '700',
    },
    authorOwn: {
        color: '#F43F5E',
    },
    authorPartner: {
        color: '#6366F1',
    },
    timestamp: {
        fontSize: 10,
        color: '#CBD5E1',
    },
    commentText: {
        fontSize: 13,
        color: '#334155',
        lineHeight: 18,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'flex-end',
        marginTop: 6,
    },
    actionBtn: {
        padding: 4,
    },
});
