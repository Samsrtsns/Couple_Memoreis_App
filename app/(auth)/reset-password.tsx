import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { supabase } from "@/src/lib/supabase";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Keyboard,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleUpdatePassword = async () => {
        if (!password) {
            Alert.alert("Hata", "Lütfen yeni şifrenizi girin.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Hata", "Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Hata", "Şifreler eşleşmiyor.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            await supabase.auth.signOut();

            Alert.alert(
                "Başarılı",
                "Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz.",
                [{ text: "Tamam", onPress: () => router.replace("/(auth)/login") }]
            );
        } catch (error: any) {
            Alert.alert("Hata", error.message || "Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-bgLight">
                    <KeyboardAwareScrollView
                        enableOnAndroid
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingHorizontal: 24,
                            justifyContent: 'center',
                        }}
                    >
                        <View className="items-center mb-8">
                            <Text className="text-3xl font-black text-bgDark" style={{ fontFamily: 'InterBlack' }}>
                                Şifre Yenileme
                            </Text>
                            <Text className="mt-2 text-slate-500 text-center text-sm px-4">
                                Lütfen yeni ve güçlü bir şifre belirleyin.
                            </Text>
                        </View>

                        <View className="gap-y-6">
                            <TextInputArea
                                label="Yeni Şifre"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                secureTextEntry={!showPass}
                                right={
                                    <Ionicons
                                        name={showPass ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#94A3B8"
                                    />
                                }
                                onRightPress={() => setShowPass((s) => !s)}
                            />

                            <TextInputArea
                                label="Şifre Onayla"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="••••••••"
                                secureTextEntry={!showPass}
                            />

                            <PrimaryButton
                                title="Şifreyi Güncelle"
                                loading={loading}
                                onPress={handleUpdatePassword}
                            />
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </TouchableWithoutFeedback>
        </Screen>
    );
}
