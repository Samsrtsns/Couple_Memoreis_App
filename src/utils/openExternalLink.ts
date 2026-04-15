import { Alert, Linking } from "react-native";

export async function openExternalLink(
    url: string,
    messages: { cannotOpen: string; failed: string }
): Promise<void> {
    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("", messages.cannotOpen);
        }
    } catch {
        Alert.alert("", messages.failed);
    }
}
