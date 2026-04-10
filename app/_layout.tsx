import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import '@/src/i18n';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack, router, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Linking, LogBox, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "./global.css";

import {
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black
} from '@expo-google-fonts/inter';

const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) {
    void SplashScreen.preventAutoHideAsync().catch(() => {});
}

LogBox.ignoreLogs([
    "SafeAreaView has been deprecated"
]);

function NavigationRoot() {
    const { state } = useAuth();
    const { isInitialized, isLoggedIn, isGuest } = state;
    const pathname = usePathname();
    const segments = useSegments();
    const segmentList = segments as string[];
    const splashHiddenRef = useRef(false);
    const pendingRecoveryRef = useRef(false);

    function getUrlParam(url: string, key: string): string | null {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = url.match(new RegExp(`[?#&]${escaped}=([^&#]+)`));
        return match ? decodeURIComponent(match[1]) : null;
    }

    useEffect(() => {
        async function handleIncomingUrl(url: string | null) {
            if (!url) return;

            const isResetRoute = url.includes('://reset-password');
            const recoveryType = getUrlParam(url, 'type') === 'recovery';
            if (!isResetRoute && !recoveryType) return;

            const accessToken = getUrlParam(url, 'access_token');
            const refreshToken = getUrlParam(url, 'refresh_token');

            if (accessToken && refreshToken) {
                pendingRecoveryRef.current = true;
                try {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                } catch (e) {
                    console.error('[DeepLink] Failed to set recovery session:', e);
                    pendingRecoveryRef.current = false;
                }
            }

            router.replace('/(auth)/reset-password');
        }

        void Linking.getInitialURL()
            .then((url) => handleIncomingUrl(url))
            .catch((e) => console.error('[DeepLink] getInitialURL failed:', e));

        const sub = Linking.addEventListener('url', (event) => {
            void handleIncomingUrl(event.url);
        });

        return () => sub.remove();
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        async function handleNavigation() {
            // Use a globally managed or more stable hiding logic
            if (!isExpoGo && !splashHiddenRef.current) {
                splashHiddenRef.current = true;
                // Add a very slight delay to ensure the native view is ready on iOS
                setTimeout(async () => {
                    try {
                        await SplashScreen.hideAsync();
                    } catch (e: any) {
                        // This error is usually safe to ignore if the splash is already gone
                        console.warn('SplashScreen hide warning:', e?.message || 'already hidden');
                    }
                }, 50);
            }

            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                const isFirstLaunch = hasLaunched !== 'true';
                const shouldRedirectToPairAfterRegister =
                    (await AsyncStorage.getItem('redirectToPairAfterRegister')) === 'true';
                const isPairingPath =
                    segmentList[0] === '(pairing)' ||
                    pathname.startsWith('/(pairing)') ||
                    pathname === '/pair';
                const isAuthPath = ['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname);
                const isOnboardingPath = pathname.startsWith('/onboarding');
                const isRealRootPath = (pathname === '/' || pathname === '') && segmentList.length === 0;
                const isTabsPath = segmentList[0] === '(tabs)';

                if (isLoggedIn) {
                    if (shouldRedirectToPairAfterRegister) {
                        await AsyncStorage.removeItem('redirectToPairAfterRegister');
                        if (!isPairingPath) {
                            router.replace('/(pairing)/pair?from=register');
                        }
                        return;
                    }

                    if (pendingRecoveryRef.current) {
                        pendingRecoveryRef.current = false;
                        router.replace('/(auth)/reset-password');
                        return;
                    }
                    if (pathname === '/reset-password') return;
                    if (isAuthPath || isOnboardingPath || isRealRootPath) {
                        router.replace('/(tabs)/home');
                    }
                    return;
                }

                // Guest mode: allow browsing tabs without authentication
                if (isGuest) {
                    // If guest is on auth path (navigated to login/register intentionally), let them stay
                    if (isAuthPath) return;
                    // If guest is already on tabs, let them stay
                    if (isTabsPath) return;
                    // Otherwise redirect to tabs
                    if (isRealRootPath || isOnboardingPath) {
                        router.replace('/(tabs)/home');
                    }
                    return;
                }

                if (isAuthPath) return;
                if (isFirstLaunch) {
                    if (isOnboardingPath) return;
                    router.replace('/(onboarding)/onboarding');
                    return;
                }
                router.replace('/(auth)/login');
            } catch (e) {
                console.error('Navigation error:', e);
                router.replace('/(auth)/login');
            }
        }

        void handleNavigation().catch(() => {});
    }, [isInitialized, isLoggedIn, isGuest, pathname, segmentList]);

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
            <SafeAreaProvider>
                <AuthProvider>
                    <NavigationRoot />
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
