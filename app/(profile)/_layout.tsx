import { Stack, router, Redirect } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ProfileLayout() {
    const { state } = useAuth();
    const { t } = useTranslation();

    // Oturum kapandıysa veya hesap silindiyse direkt Login ekranına fırlat
    if (state.isInitialized && !state.isLoggedIn) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Stack 
            screenOptions={{ 
                headerBackTitle: '',
                headerStyle: { backgroundColor: '#FDF8F7' },
                headerShadowVisible: false,
                headerTintColor: '#0F172A',
                contentStyle: { backgroundColor: '#FDF8F7' },
                headerLeft: () => (
                    <Pressable 
                        onPress={() => router.back()} 
                        className="flex w-10 h-10 items-center justify-center rounded-full active:bg-slate-100"
                    >
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </Pressable>
                )
            }}
        >
            <Stack.Screen name="personal-info" options={{ title: t('profile.personalInfo') }} />
            <Stack.Screen name="account-settings" options={{ title: t('profile.accountSettings') }} />
            <Stack.Screen name="app-settings" options={{ title: t('profile.appSettings') }} />
            <Stack.Screen name="relationship" options={{ title: t('profile.relationshipSettings') }} />
            <Stack.Screen name="plan-limits" options={{ title: t('profile.planLimits') }} />
            <Stack.Screen name="data-management" options={{ title: 'Data Management' }} />
            <Stack.Screen
                name="privacy"
                options={{
                    title: t('profile.privacyPolicy'),
                    headerLargeTitle: false,
                    headerTitleStyle: { fontSize: 17, fontWeight: '600' },
                }}
            />
            <Stack.Screen name="rc-debug" options={{ title: 'RC Debug' }} />
        </Stack>
    );
}
