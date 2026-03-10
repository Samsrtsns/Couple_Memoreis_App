/**
 * useDeletePlaceComment — deletes a comment if current user is the owner.
 */

import { useAuth } from '@/src/context/AuthContext';
import { useCallback, useState } from 'react';
import { deleteComment } from '../services/placeCommentsService';

export type UseDeletePlaceCommentReturn = {
    remove: (commentId: string) => Promise<boolean>;
    loading: boolean;
    error: string | null;
};

export function useDeletePlaceComment(
    onSuccess?: (commentId: string) => void
): UseDeletePlaceCommentReturn {
    const { state } = useAuth();
    const currentUserId = state.profile?.id;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remove = useCallback(
        async (commentId: string): Promise<boolean> => {
            if (!currentUserId) {
                setError('Not authenticated.');
                return false;
            }
            setLoading(true);
            setError(null);
            try {
                await deleteComment(commentId, currentUserId);
                onSuccess?.(commentId);
                return true;
            } catch (e: any) {
                setError(e.message ?? 'Failed to delete comment.');
                return false;
            } finally {
                setLoading(false);
            }
        },
        [currentUserId, onSuccess]
    );

    return { remove, loading, error };
}
