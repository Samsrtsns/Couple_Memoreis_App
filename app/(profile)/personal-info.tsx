import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useProfile } from '@/src/hooks/useProfile';
import { updateProfile } from '@/src/services/profileService';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function PersonalInfoScreen() {
    const { profile, refetch } = useProfile();
    const { state } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const parseProfileDate = (dateStr: string) => {
        // "YYYY-MM-DD" değerini local timezone'da oluştur, UTC kaymasını engelle.
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
        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            if (profile.birth_date) {
                setBirthDate(parseProfileDate(profile.birth_date));
            }
        }
    }, [profile]);

    const handleSave = async () => {
        if (!state.user?.id) return;
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert("Hata", "Ad ve soyad zorunludur.");
            return;
        }

        setSaving(true);
        try {
            await updateProfile({
                userId: state.user.id,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                birth_date: birthDate ? toLocalDateOnlyString(birthDate) : null,
            });
            await refetch();
            Alert.alert("Başarılı", "Bilgileriniz güncellendi.");
        } catch (error: any) {
            Alert.alert("Hata", error.message || "Profil güncellenemedi.");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Ayarlanmadı';
        return date.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <View className="flex-1 bg-[#FDF8F7]">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
            <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 120 }}
            >
                <Text className="text-slate-500 text-sm mb-8">
                    Adınızı, doğum tarihinizi ve e-posta bilginizi buradan yönetebilirsiniz. Şifre ve hesap silme için Hesap Ayarları ekranına gidin.
                </Text>

                <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm gap-y-6">
                    {/* First Name */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            Adınız
                        </Text>
                        <TextInput
                            className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-800 font-semibold border border-slate-100"
                            placeholder="Adınız"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>

                    {/* Last Name */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            Soyadınız
                        </Text>
                        <TextInput
                            className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-800 font-semibold border border-slate-100"
                            placeholder="Soyadınız"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>

                    {/* Email */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            E-posta Adresiniz
                        </Text>
                        <View className="bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 opacity-60">
                            <Text className="text-slate-500 font-medium">{profile?.email || 'N/A'}</Text>
                        </View>
                        <Text className="text-[10px] text-slate-400 mt-2 ml-1 italic">
                            E-posta adresi değiştirilemez.
                        </Text>
                    </View>

                    {/* Birth Date */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            Doğum Tarihiniz
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="bg-slate-50 rounded-2xl px-4 py-4 flex-row items-center justify-between border border-slate-100"
                        >
                            <Text className={`font-semibold ${birthDate ? 'text-slate-800' : 'text-slate-400'}`}>
                                {formatDate(birthDate)}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#ea5385" />
                        </TouchableOpacity>
                    </View>
                </View>

                {showDatePicker && Platform.OS === 'ios' && (
                    <View className="mt-4 bg-white rounded-2xl border border-slate-100 overflow-hidden">
                        <View className="px-4 py-3 border-b border-slate-100 items-end">
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Text className="text-[#ea5385] font-bold">Bitti</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={birthDate || new Date()}
                            mode="date"
                            display="spinner"
                            textColor="#000000"
                            themeVariant="light"
                            onChange={(_, date) => {
                                if (date) setBirthDate(date);
                            }}
                            maximumDate={new Date()}
                        />
                    </View>
                )}

                {showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={birthDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={(_, date) => {
                            setShowDatePicker(false);
                            if (date) setBirthDate(date);
                        }}
                        maximumDate={new Date()}
                    />
                )}

                {/* Save Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`mt-10 h-16 rounded-[28px] items-center justify-center shadow-lg ${saving ? 'bg-slate-300' : 'bg-[#ea5385]'
                        }`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Değişiklikleri Kaydet</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
