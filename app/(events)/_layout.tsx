import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable } from 'react-native';

import { HEADER_HIT, HEADER_ICON_SM } from './headerMetrics';

/**
 * Profil yığını ile aynı app bar renkleri; geri: küçük ikon, dikey ortalı, yuvarlak dokunma alanı.
 */
export default function EventsLayout() {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerBackTitle: '',
                headerStyle: { backgroundColor: '#FDF8F7' },
                headerShadowVisible: false,
                headerTintColor: '#0F172A',
                contentStyle: { backgroundColor: '#FDF8F7' },
                headerTitleAlign: 'center',
                headerLeft: () => (
                    <Pressable
                        onPress={() => router.back()}
                        accessibilityRole="button"
                        accessibilityLabel="Geri"
                        android_ripple={{
                            color: 'rgba(15, 23, 42, 0.12)',
                            borderless: true,
                            radius: HEADER_HIT / 2,
                        }}
                        style={({ pressed }) => ({
                            marginLeft: 8,
                            width: HEADER_HIT,
                            height: HEADER_HIT,
                            borderRadius: HEADER_HIT / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor:
                                Platform.OS === 'ios' && pressed ? 'rgba(15, 23, 42, 0.06)' : 'transparent',
                        })}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={HEADER_ICON_SM}
                            color="#0F172A"
                            style={{
                                includeFontPadding: false,
                                textAlignVertical: 'center',
                                textAlign: 'center',
                                lineHeight: HEADER_ICON_SM,
                                marginLeft: 6,
                            }}
                        />
                    </Pressable>
                ),
            }}
        >
            <Stack.Screen name="index" options={{ title: 'Özel Günler' }} />
        </Stack>
    );
}
