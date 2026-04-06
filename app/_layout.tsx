import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { LogBox, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "./global.css";

import {
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black
} from '@expo-google-fonts/inter';
import { initRevenueCat } from '@/src/services/revenueCatService';

// Prevent auto-hiding the splash screen until our fonts are loaded
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
    "SafeAreaView has been deprecated"
]);

function NavigationRoot() {
    const { state } = useAuth();
    const { isInitialized, isLoggedIn } = state;

    useEffect(() => {
        if (!isInitialized) return;

        async function handleNavigation() {
            try {
                await SplashScreen.hideAsync();
            } catch {
                /* already hidden */
            }

            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                const isFirstLaunch = hasLaunched !== 'true';

                // Oturum varsa Supabase token'ı zaten AsyncStorage'da; doğrudan ana ekran
                if (isLoggedIn) {
                    router.replace('/(tabs)/home');
                    return;
                }
                if (isFirstLaunch) {
                    router.replace('/(onboarding)/onboarding');
                    return;
                }
                router.replace('/(auth)/login');
            } catch (e) {
                console.error('Navigation error:', e);
                router.replace('/(auth)/login');
            }
        }

        handleNavigation();
    }, [isInitialized, isLoggedIn]);

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(events)" />
            <Stack.Screen
                name="memory-detail"
                options={{
                    presentation: "card",
                    animation: "slide_from_right",
                }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Inter: Inter_400Regular,
        InterBold: Inter_700Bold,
        InterBlack: Inter_900Black,
    });

    const [isAppReady, setIsAppReady] = useState(false);

    useEffect(() => {
        if (fontsLoaded) {
            initRevenueCat().catch(err => console.error('[initRevenueCat] Failed:', err));

            // Override global Text font family
            const TextRender = Text as any;
            if (!TextRender.defaultProps) {
                TextRender.defaultProps = {};
            }
            TextRender.defaultProps.style = [
                TextRender.defaultProps.style,
                { fontFamily: 'InterBlack' },
            ];
            
            setIsAppReady(true);
        }
    }, [fontsLoaded]);

    if (!isAppReady) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <NavigationRoot />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}
