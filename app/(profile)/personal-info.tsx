import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { useProfile } from '@/src/hooks/useProfile';
import { updateProfile } from '@/src/services/profileService';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { normalizeDateToNoon } from '@/src/utils/dateUtils';

export default function PersonalInfoScreen() {
    const { t, i18n } = useTranslation();
    const { profile, refetch } = useProfile();
    const { state } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    const parseProfileDate = (dateStr: string) => {
        const parts = dateStr.split('-').map(Number);
        if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
            const [year, month, day] = parts;
            return new Date(year, month - 1, day, 12, 0, 0, 0);
        }
        const d = new Date(dateStr);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
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
            Alert.alert(t("common.error"), t("personalInfo.requiredName"));
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
            Alert.alert(t("common.success"), t("personalInfo.updated"));
        } catch (error: any) {
            Alert.alert(t("common.error"), error.message || t("personalInfo.updateFailed"));
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return t("personalInfo.notSet");
        return date.toLocaleDateString(i18n.language || "tr-TR", {
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
                    {t("personalInfo.helper")}
                </Text>

                <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm gap-y-6">
                    {/* First Name */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            {t("personalInfo.firstName")}
                        </Text>
                        <TextInput
                            className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-800 font-semibold border border-slate-100"
                            placeholder={t("personalInfo.firstNamePlaceholder")}
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>

                    {/* Last Name */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            {t("personalInfo.lastName")}
                        </Text>
                        <TextInput
                            className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-800 font-semibold border border-slate-100"
                            placeholder={t("personalInfo.lastNamePlaceholder")}
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>

                    {/* Email */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            {t("personalInfo.email")}
                        </Text>
                        <View className="bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 opacity-60">
                            <Text className="text-slate-500 font-medium">{profile?.email || 'N/A'}</Text>
                        </View>
                        <Text className="text-[10px] text-slate-400 mt-2 ml-1 italic">
                            {t("personalInfo.emailNotChangeable")}
                        </Text>
                    </View>

                    {/* Birth Date */}
                    <View>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                            {t("personalInfo.birthDate")}
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
                                <Text className="text-[#ea5385] font-bold">{t("personalInfo.done")}</Text>
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={birthDate || new Date()}
                            mode="date"
                            display="spinner"
                            textColor="#000000"
                            themeVariant="light"
                            onChange={(_, date) => {
                                if (date) setBirthDate(normalizeDateToNoon(date));
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
                            if (date) setBirthDate(normalizeDateToNoon(date));
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
                        <Text className="text-white font-bold text-lg">{t("personalInfo.saveChanges")}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
