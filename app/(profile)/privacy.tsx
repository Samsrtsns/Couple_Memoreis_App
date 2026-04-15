import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { EXTERNAL_LINKS } from '@/src/constants/externalLinks';
import { openExternalLink } from '@/src/utils/openExternalLink';

export default function PrivacyPolicyScreen() {
    const { t } = useTranslation();
    const [policy, setPolicy] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchPolicy = async () => {
        setLoading(true);
        setError(false);
        try {
            const { data, error: fetchError } = await supabase
                .from('legal_documents')
                .select('content')
                .eq('type', 'privacy_policy')
                .limit(1)
                .single();

            if (fetchError) throw fetchError;
            if (data) {
                setPolicy(data.content);
            }
        } catch (e) {
            console.error('Error fetching privacy policy:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicy();
    }, []);

    const openOfficialPrivacy = () => {
        void openExternalLink(EXTERNAL_LINKS.privacyPolicy, {
            cannotOpen: t('common.linkCannotOpen'),
            failed: t('common.linkOpenFailed'),
        });
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#FDF8F7] items-center justify-center">
                <ActivityIndicator size="large" color="#ea5385" />
                <Text className="mt-4 text-slate-400 font-medium tracking-wide">
                    {t('privacyScreen.loading')}
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 bg-[#FDF8F7] items-center justify-center px-8">
                <View className="w-16 h-16 bg-rose-50 rounded-full items-center justify-center mb-4">
                    <Ionicons name="warning-outline" size={32} color="#F43F5E" />
                </View>
                <Text className="text-slate-800 text-lg font-bold text-center">
                    {t('privacyScreen.errorTitle')}
                </Text>
                <Text className="text-slate-500 text-center mt-2 leading-5">
                    {t('privacyScreen.errorMessage')}
                </Text>
                <Pressable 
                    onPress={fetchPolicy}
                    className="mt-8 bg-rose-500 px-8 py-3 rounded-full active:opacity-80"
                >
                    <Text className="text-white font-bold">{t('privacyScreen.retry')}</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#FDF8F7]" edges={['bottom', 'left', 'right']}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
            >
                <Pressable
                    onPress={openOfficialPrivacy}
                    className="flex-row items-center gap-2 mb-5 px-4 py-3 rounded-2xl bg-white border border-slate-200 active:opacity-80"
                >
                    <Ionicons name="open-outline" size={20} color="#2563EB" />
                    <Text className="flex-1 text-[15px] font-semibold text-slate-800">
                        {t('privacyScreen.openOfficialPage')}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>
                <Text className="text-slate-700 text-base leading-6 tracking-wide">
                    {policy || t('privacyScreen.emptyContent')}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
