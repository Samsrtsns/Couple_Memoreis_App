import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    message: string | null;
    onDismiss: () => void;
    durationMs?: number;
};

/**
 * iOS ve genel snackbar benzeri bildirim (Android’de ayrıca ToastAndroid kullanılabilir).
 */
export function ToastBanner({ message, onDismiss, durationMs = 4000 }: Props) {
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onDismiss, durationMs);
        return () => clearTimeout(t);
    }, [message, durationMs, onDismiss]);

    if (!message) return null;

    return (
        <View
            className="absolute left-4 right-4 px-4 py-3.5 rounded-2xl bg-slate-900 shadow-lg"
            style={{ bottom: Math.max(insets.bottom, 16) + 8, zIndex: 999 }}
            pointerEvents="none"
        >
            <Text className="text-white text-[15px] text-center leading-5 font-medium">
                {message}
            </Text>
        </View>
    );
}
