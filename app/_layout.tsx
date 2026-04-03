import { AuthProvider } from '@/src/context/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import "./global.css";

import {
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black
} from '@expo-google-fonts/inter';

// Prevent auto-hiding the splash screen until our fonts are loaded
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
    "SafeAreaView has been deprecated"
]);

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Inter: Inter_400Regular,
        InterBold: Inter_700Bold,
        InterBlack: Inter_900Black,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();

            // Override global Text font family
            const TextRender = Text as any;
            if (!TextRender.defaultProps) {
                TextRender.defaultProps = {};
            }
            TextRender.defaultProps.style = [
                TextRender.defaultProps.style,
                { fontFamily: 'InterBlack' },
            ];
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(onboarding)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(events)/index" />
                <Stack.Screen
                    name="memory-detail"
                    options={{
                        presentation: "card",
                        animation: "slide_from_right",
                    }}
                />
            </Stack>
        </AuthProvider>
    );
}
