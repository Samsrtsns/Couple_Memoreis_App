import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type UsageStats = {
    user_type: 'base' | 'premium';
    total_photo_memories: number;
    total_places: number;
    today_photos: number;
    max_photo_memories: number;
    max_places: number;
    max_daily_photos: number;
};

export const getTimeUntilReset = () => {
    const now = new Date();
    const resetTime = new Date();
    resetTime.setHours(5, 0, 0, 0);

    if (now >= resetTime) {
        resetTime.setDate(resetTime.getDate() + 1);
    }

    const diff = resetTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
        hours,
        minutes,
        seconds,
        formatted: `${hours}h ${minutes}m ${seconds}s`
    };
};

export const useUsageStats = () => {
    const [stats, setStats] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    const isDailyLimitReached = stats
        ? (stats.user_type === 'premium' ? false : (stats.today_photos ?? 0) >= (stats.max_daily_photos ?? 0))
        : false;

    useEffect(() => {
        if (!isDailyLimitReached) return;
        
        const updateTimer = () => {
            const time = getTimeUntilReset();
            setTimeRemaining(time.formatted);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isDailyLimitReached]);

    const fetchStats = useCallback(async (userId: string) => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_usage_stats', { p_user_id: userId });

        if (error) {
            console.error("Stats çekilemedi:", error.message);
        } else {
            setStats(data as UsageStats);
        }
        setLoading(false);
    }, []);

    return { stats, loading, fetchStats, isDailyLimitReached, timeRemaining };
};
