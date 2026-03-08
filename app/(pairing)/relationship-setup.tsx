import { useRelationshipSetup } from "@/src/hooks/useRelationshipSetup";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React from "react";
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from "react-native";

export default function RelationshipSetupScreen() {
    const {
        myBirthDate,
        partnerBirthDate,
        relationshipStartDate,
        activeDatePicker,
        setActiveDatePicker,
        handleDateChange,
        closePicker,
        submit,
        loading,
        formatDate,
    } = useRelationshipSetup();

    const getActiveDate = () => {
        if (activeDatePicker === "myBirth") return myBirthDate;
        if (activeDatePicker === "partnerBirth") return partnerBirthDate;
        if (activeDatePicker === "relationStart") return relationshipStartDate;
        return new Date();
    };

    return (
        <View className="flex-1 bg-bgLight px-6">
            {/* Back */}
            <View className="flex-row w-full justify-start items-start mt-16">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/70 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={20} color="#0f172a" />
                </Pressable>
            </View>

            {/* Header */}
            <View className="items-center mt-6 px-3">
                <Text className="text-[26px] font-bold text-slate-900 text-center">
                    One Last Step
                </Text>
                <Text className="text-[14px] text-slate-500 text-center mt-2 leading-5">
                    Enter your and your partner&apos;s birthday, and the date your
                    relationship started. These details will be saved for both of you.
                </Text>
            </View>

            {/* Form Card */}
            <View className="mt-10 bg-white rounded-3xl p-5 shadow-sm">
                {/* My Birthday */}
                <Text className="text-sm font-semibold text-slate-700 mb-3">
                    Your Birthday
                </Text>

                <Pressable
                    onPress={() => setActiveDatePicker("myBirth")}
                    className="w-full h-14 rounded-2xl border border-slate-200 px-4 flex-row items-center justify-between bg-slate-50"
                >
                    <Text className="text-base font-medium text-slate-900">
                        {formatDate(myBirthDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#475569" />
                </Pressable>

                {/* Partner Birthday */}
                <Text className="text-sm font-semibold text-slate-700 mt-6 mb-3">
                    Partner&apos;s Birthday
                </Text>

                <Pressable
                    onPress={() => setActiveDatePicker("partnerBirth")}
                    className="w-full h-14 rounded-2xl border border-slate-200 px-4 flex-row items-center justify-between bg-slate-50"
                >
                    <Text className="text-base font-medium text-slate-900">
                        {formatDate(partnerBirthDate)}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#475569" />
                </Pressable>

                {/* Relationship Start */}
                <Text className="text-sm font-semibold text-slate-700 mt-6 mb-3">
                    Relationship Start Date
                </Text>

                <Pressable
                    onPress={() => setActiveDatePicker("relationStart")}
                    className="w-full h-14 rounded-2xl border border-slate-200 px-4 flex-row items-center justify-between bg-slate-50"
                >
                    <Text className="text-base font-medium text-slate-900">
                        {formatDate(relationshipStartDate)}
                    </Text>
                    <Ionicons name="heart-outline" size={20} color="#475569" />
                </Pressable>

                {/* Submit */}
                <Pressable
                    onPress={submit}
                    disabled={loading}
                    className={`w-full h-14 mt-8 rounded-2xl bg-[#ea5385] items-center justify-center ${loading ? "opacity-70" : "opacity-100"}`}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-white font-bold text-base">
                            Haydi Başlayalım
                        </Text>
                    )}
                </Pressable>
            </View>

            {loading && (
                <Modal transparent visible={loading} animationType="fade">
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#ea5385" />
                    </View>
                </Modal>
            )}

            {/* Unified Date Picker */}
            {activeDatePicker && (
                <>
                    {Platform.OS === "ios" ? (
                        <Modal transparent visible={!!activeDatePicker} animationType="slide">
                            <Pressable
                                className="flex-1 justify-end"
                                onPress={closePicker}
                            >
                                <Pressable className="bg-white rounded-t-3xl p-5 shadow-lg max-h-[40%]">
                                    <View className="flex-row justify-between items-center px-4 mb-2">
                                        <Text className="font-bold text-slate-800 text-lg">
                                            Select Date
                                        </Text>
                                        <Pressable onPress={closePicker}>
                                            <Text className="text-[#ea5385] font-bold text-base">Done</Text>
                                        </Pressable>
                                    </View>
                                    <DateTimePicker
                                        value={getActiveDate()}
                                        mode="date"
                                        display="spinner"
                                        themeVariant="light"
                                        maximumDate={new Date()}
                                        onChange={handleDateChange}
                                        textColor="#000000"
                                        style={{ height: 200, width: "100%" }}
                                    />
                                </Pressable>
                            </Pressable>
                        </Modal>
                    ) : (
                        <DateTimePicker
                            value={getActiveDate()}
                            mode="date"
                            display="default"
                            maximumDate={new Date()}
                            onChange={handleDateChange}
                        />
                    )}
                </>
            )}
        </View>
    );
}