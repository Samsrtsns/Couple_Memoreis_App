import { AuthProvider } from '@/src/context/AuthContext';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';
import "./global.css";

LogBox.ignoreLogs([
    "SafeAreaView has been deprecated"
]);

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(events)/index" />
            </Stack>
        </AuthProvider>
    );
}
