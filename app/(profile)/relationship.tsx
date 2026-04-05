import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useProfile } from '@/src/hooks/useProfile';
import { updateProfile } from '@/src/services/profileService';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RelationshipScreen() {
    const { profile, partner, refetch } = useProfile();
    const { state } = useAuth();
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile?.relationship_start_date) {
            setStartDate(new Date(profile.relationship_start_date));
        }
    }, [profile]);

    const handleSave = async () => {
        if (!state.user?.id) return;

        setSaving(true);
        try {
            await updateProfile({
                userId: state.user.id,
                relationship_start_date: startDate ? startDate.toISOString() : null,
            });
            await refetch();
            Alert.alert("Success", "Relationship settings updated successfully.");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update relationship settings.");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return 'Not set yet';
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <View className="flex-1 bg-[#FDF8F7]">
            <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 12 }}>
                <Text className="text-slate-500 text-sm mb-8">
                    Manage your partner connection and relation anniversary date.
                </Text>

                {/* Partner Info Card */}
                <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
                    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 ml-1">
                        Connected Partner
                    </Text>
                    {partner ? (
                        <View className="flex-row items-center gap-x-4 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                            <View className="w-12 h-12 rounded-full bg-rose-200 items-center justify-center">
                                <Ionicons name="heart" size={24} color="#F43F5E" />
                            </View>
                            <View>
                                <Text className="text-slate-800 font-bold text-base">
                                    {partner.first_name} {partner.last_name}
                                </Text>
                                <Text className="text-rose-500 text-xs font-semibold">Matched and Connected</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 items-center">
                            <Text className="text-slate-400 font-medium italic">No partner connected yet.</Text>
                        </View>
                    )}
                </View>

                {/* Anniversary Setting */}
                <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 ml-1">
                        Our Anniversary
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
                        This date is used to calculate how long you have been together.
                    </Text>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={startDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (date) setStartDate(date);
                        }}
                        maximumDate={new Date()}
                    />
                )}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className={`mt-10 h-16 rounded-3xl items-center justify-center shadow-lg ${saving ? 'bg-slate-300' : 'bg-[#ea5385]'
                        }`}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Save Changes</Text>
                    )}
                </TouchableOpacity>

                {/* Unpair Option (Future) */}
                <TouchableOpacity className="mt-10 items-center">
                    <Text className="text-slate-300 font-bold text-xs uppercase tracking-widest">
                        Manage Connection Code
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
