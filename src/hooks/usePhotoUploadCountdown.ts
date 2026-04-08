import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    getRemainingPhotoCooldown,
    getNextPhotoResetTime,
    isPremiumUser,
    shouldLockPhotoUpload,
} from '../utils/photoLimitUtils';

export type UsePhotoUploadCountdownReturn = {
    canUpload: boolean;
    isLocked: boolean;
    remainingMs: number;
    remainingText: string;
    nextResetAt: Date | null;
    isPremium: boolean;
};

export function usePhotoUploadCountdown(): UsePhotoUploadCountdownReturn {
    const { state, refreshProfile } = useAuth();
    const profile = state.profile;

    const premium = isPremiumUser(profile);
    const locked = shouldLockPhotoUpload(profile);

    const [cooldown, setCooldown] = useState(() => getRemainingPhotoCooldown());
    const hasRefreshedRef = useRef(false);

    useEffect(() => {
        if (premium || !locked) {
            setCooldown({ remainingMs: 0, remainingText: '00:00:00' });
            hasRefreshedRef.current = false;
            return;
        }

        const tick = () => {
            const next = getRemainingPhotoCooldown();
            setCooldown(next);

            if (next.remainingMs <= 0 && !hasRefreshedRef.current) {
                hasRefreshedRef.current = true;
                refreshProfile();
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [premium, locked, refreshProfile]);

    const nextResetAt = locked && !premium ? getNextPhotoResetTime() : null;

    return {
        canUpload: premium || !locked,
        isLocked: !premium && locked,
        remainingMs: cooldown.remainingMs,
        remainingText: cooldown.remainingText,
        nextResetAt,
        isPremium: premium,
    };
}
