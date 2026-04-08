import { UnlinkCoupleModal } from '@/src/components/UnlinkCoupleModal';
import { ToastBanner } from '@/src/components/ToastBanner';
import { useAuth } from '@/src/context/AuthContext';
import { useProfile } from '@/src/hooks/useProfile';
import { updateProfile } from '@/src/services/profileService';
import { unlinkCouple } from '@/src/services/coupleService';
import { showErrorToast } from '@/src/utils/errorToast';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RelationshipScreen() {
    const { profile, partner, refetch } = useProfile();
    const { state, refreshProfile } = useAuth();
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [unlinkModalVisible, setUnlinkModalVisible] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const unlinkGuardRef = useRef(false);

    const parseProfileDate = (dateStr: string) => {
        const parts = dateStr.split('-').map(Number);
        if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
            const [year, month, day] = parts;
            return new Date(year, month - 1, day);
        }
        return new Date(dateStr);
    };

    const toLocalDateOnlyString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        if (profile?.relationship_start_date) {
            setStartDate(parseProfileDate(profile.relationship_start_date));
        }
    }, [profile]);

    const handleSave = async () => {
        if (!state.user?.id) return;

        setSaving(true);
        try {
            await updateProfile({
                userId: state.user.id,
                relationship_start_date: startDate ? toLocalDateOnlyString(startDate) : null,
            });
            await refetch();
            Alert.alert('Başarılı', 'İlişki ayarları başarıyla güncellendi.');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'İlişki ayarları güncellenemedi.';
            showErrorToast(msg, setToastMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmUnlink = async () => {
        if (unlinkGuardRef.current || unlinking) return;
        unlinkGuardRef.current = true;
        setUnlinking(true);
        try {
            await unlinkCouple();
            await refreshProfile();
            setUnlinkModalVisible(false);
            router.replace('/(pairing)/pair');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Bağlantı kaldırılamadı.';
            showErrorToast(msg, setToastMsg);
        } finally {
            setUnlinking(false);
            unlinkGuardRef.current = false;
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Henüz ayarlanmadı';
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <View className="flex-1 bg-[#FDF8F7]">
            <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 40 }}>
                <Text className="text-slate-500 text-sm mb-8">
                    Partner bağlantınızı ve ilişki yıldönümü tarihinizi buradan yönetin.
                </Text>

                <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
                    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 ml-1">
                        Bağlı Partner
                    </Text>
                    {partner ? (
                        <View className="flex-row items-center gap-x-4 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                            <View className="w-12 h-12 rounded-full bg-rose-200 items-center justify-center">
                                <Ionicons name="heart" size={24} color="#F43F5E" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-800 font-bold text-base">
                                    {partner.first_name} {partner.last_name}
                                </Text>
                                <Text className="text-rose-500 text-xs font-semibold">Eşleşti ve Bağlandı</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 items-center">
                            <Text className="text-slate-400 font-medium italic text-center">
                                Henüz bir partnerle bağlantı kurulmadı.
                            </Text>
                        </View>
                    )}
                </View>

                <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 ml-1">
                        Yıldönümümüz
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        className="bg-slate-50 rounded-2xl px-4 py-4 flex-row items-center justify-between border border-slate-100"
                    >
                        <View className="flex-row items-center gap-x-3">
                            <Ionicons name="calendar-outline" size={20} color="#ea5385" />
                            <Text className={`font-semibold ${startDate ? 'text-slate-800' : 'text-slate-400'}`}>
                                {formatDate(startDate)}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                    </TouchableOpacity>
                    <Text className="text-[11px] text-slate-400 mt-3 ml-1 leading-4">
                        Bu tarih, ne kadar süredir birlikte olduğunuzu hesaplamak için kullanılır.
                    </Text>
                </View>

                {showDatePicker && Platform.OS === 'ios' && (
                    <View className="mt-4 bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <View className="px-4 py-3 border-b border-slate-100 items-end">
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text className="text-[#ea5385] font-bold">Bitti</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={startDate || new Date()}
                            mode="date"
                            display="spinner"
                            textColor="#000000"
                            themeVariant="light"
                            onChange={(_, date) => {
                                if (date) setStartDate(date);
                            }}
                            maximumDate={new Date()}
                        />
                    </View>
                )}

                {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={startDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, date) => {
                            setShowDatePicker(false);
                            if (date) setStartDate(date);
                        }}
                        maximumDate={new Date()}
                    />
                )}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`mt-10 h-16 rounded-3xl items-center justify-center shadow-lg ${
                        saving ? 'bg-slate-300' : 'bg-[#ea5385]'
                    }`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Değişiklikleri Kaydet</Text>
                    )}
                </TouchableOpacity>

                {partner ? (
                    <View className="mt-10 pt-8 border-t border-slate-200">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 text-center">
                            Tehlikeli bölge
                        </Text>
                        <TouchableOpacity
                            onPress={() => !unlinking && setUnlinkModalVisible(true)}
                            disabled={unlinking}
                            activeOpacity={0.85}
                            className="bg-white border border-rose-200 rounded-2xl px-4 py-4 flex-row items-center justify-center gap-x-2"
                        >
                            <Ionicons name="unlink-outline" size={20} color="#E11D48" />
                            <Text className="text-rose-600 font-bold text-[15px]">Partner bağlantısını kaldır</Text>
                        </TouchableOpacity>
                        <Text className="text-slate-400 text-[11px] text-center mt-3 px-2 leading-4">
                            Ortak verileriniz silinir; yeni bir davet kodu alırsınız. Tekrar eşleşmek için kod
                            paylaşmanız gerekir.
                        </Text>
                    </View>
                ) : null}
            </ScrollView>

            <UnlinkCoupleModal
                visible={unlinkModalVisible}
                onClose={() => !unlinking && setUnlinkModalVisible(false)}
                onConfirm={handleConfirmUnlink}
                loading={unlinking}
            />

            <ToastBanner message={toastMsg} onDismiss={() => setToastMsg(null)} />
        </View>
    );
}
