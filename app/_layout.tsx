import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { initRevenueCat, fetchOfferings, findTargetOffering, checkTargetProducts, checkEntitlementStatus, fetchCustomerInfo } from '@/src/services/revenuecat';
import { supabase } from '@/src/lib/supabase';
import '@/src/i18n';
import { useFonts } from 'expo-font';
import { Stack, router, usePathname, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, LogBox, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "./global.css";

import {
    Inter_400Regular,
    Inter_700Bold,
    Inter_900Black
} from '@expo-google-fonts/inter';

/** JS bundle yüklenince başlar; splash süresi ölçümü için */
const SPLASH_APP_START_MS = Date.now();

const SPLASH_MIN_VISIBLE_MS = 2000;

void SplashScreen.preventAutoHideAsync().catch(() => {});

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
    /** Segment listesi geçici [] olduğunda (profil yenileme vb.) önceki konumu koru */
    const lastNonEmptySegmentsRef = useRef<string[]>([]);

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
            if (segmentList.length > 0) {
                lastNonEmptySegmentsRef.current = segmentList;
            }

            if (!splashHiddenRef.current) {
                splashHiddenRef.current = true;
                const elapsed = Date.now() - SPLASH_APP_START_MS;
                const waitMs = Math.max(0, SPLASH_MIN_VISIBLE_MS - elapsed);
                setTimeout(async () => {
                    try {
                        await SplashScreen.hideAsync();
                    } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : 'already hidden';
                        console.warn('SplashScreen hide warning:', msg);
                    }
                }, waitMs);
            }

            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                const isFirstLaunch = hasLaunched !== 'true';
                const normalizedPathname = pathname.replace(/\/\([^/]+\)/g, '');
                const shouldRedirectToPairAfterRegister =
                    (await AsyncStorage.getItem('redirectToPairAfterRegister')) === 'true';
                const isPairingPath =
                    segmentList[0] === '(pairing)' ||
                    pathname.startsWith('/(pairing)') ||
                    pathname === '/pair' ||
                    normalizedPathname.startsWith('/pair');
                const isAuthPath =
                    segmentList[0] === '(auth)' ||
                    ['/login', '/register', '/forgot-password', '/reset-password', '/google-name'].includes(pathname) ||
                    ['/login', '/register', '/forgot-password', '/reset-password', '/google-name'].includes(normalizedPathname);
                const authScreenSegments = ['login', 'register', 'forgot-password', 'reset-password', 'google-name'];
                const isAuthScreenSegment = segmentList.some((segment) => authScreenSegments.includes(segment));
                const isOnboardingPath = pathname.startsWith('/onboarding') || normalizedPathname.startsWith('/onboarding');
                const isRealRootPath = (pathname === '/' || pathname === '') && segmentList.length === 0;
                const isTabsPath = segmentList[0] === '(tabs)';

                const isInAppShellSegment = (first: string | undefined) =>
                    first === '(tabs)' ||
                    first === '(events)' ||
                    first === '(pairing)' ||
                    first === '(profile)' ||
                    first === 'memory-detail';

                if (isLoggedIn) {
                    const pendingGoogleOnboarding =
                        await AsyncStorage.getItem('pendingGoogleOnboarding');
                    if (pendingGoogleOnboarding === 'true') {
                        if (pathname !== '/google-name' && normalizedPathname !== '/google-name') {
                            router.replace('/(auth)/google-name');
                        }
                        return;
                    }

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
                    if (pathname === '/reset-password' || normalizedPathname === '/reset-password') return;

                    const inAppShellNow = isInAppShellSegment(segmentList[0]);
                    const wasInAppShell = isInAppShellSegment(lastNonEmptySegmentsRef.current[0]);
                    const transientRootWhileInApp =
                        isRealRootPath && wasInAppShell && segmentList.length === 0;

                    if (inAppShellNow || transientRootWhileInApp) {
                        return;
                    }

                    if (isAuthPath || isAuthScreenSegment || isOnboardingPath || isRealRootPath) {
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

    if (!isInitialized) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#ea5385" />
            </View>
        );
    }

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
        void SplashScreen.preventAutoHideAsync().catch(() => {});
    }, []);

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

    useEffect(() => {
        if (!isAppReady) return;

        async function bootstrapRevenueCat() {
            console.log('[RC BOOT] ====== RevenueCat bootstrap started ======');

            const ok = await initRevenueCat();
            if (!ok) {
                console.log('[RC BOOT] Init FAILED — aborting bootstrap');
                return;
            }

            console.log('[RC BOOT] Step 1/5 — Init complete, fetching offerings...');
            const offerings = await fetchOfferings();

            console.log('[RC BOOT] Step 2/5 — Finding target offering...');
            const target = findTargetOffering(offerings);

            console.log('[RC BOOT] Step 3/5 — Checking target products...');
            checkTargetProducts(target);

            console.log('[RC BOOT] Step 4/5 — Checking entitlement status...');
            await checkEntitlementStatus();

            console.log('[RC BOOT] Step 5/5 — Fetching customer info...');
            await fetchCustomerInfo();

            console.log('[RC BOOT] ====== RevenueCat bootstrap DONE ======');
        }

        void bootstrapRevenueCat();
    }, [isAppReady]);

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
