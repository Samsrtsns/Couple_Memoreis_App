import { Platform, ToastAndroid } from 'react-native';

/**
 * Hata mesajını gösterir: Android’de sistem toast, iOS’ta `setIosMessage` ile banner.
 */
export function showErrorToast(message: string, setIosMessage: (msg: string | null) => void) {
    const text = message.trim() || 'Bir hata oluştu.';
    if (Platform.OS === 'android') {
        ToastAndroid.show(text, ToastAndroid.LONG);
        return;
    }
    setIosMessage(text);
}
