import { Icons } from "@/assets/icons";
import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Image,
    Keyboard,
    Pressable,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function ForgotPasswordScreen() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResetRequest = async () => {
        if (!email) {
            Alert.alert(t("common.error"), t("auth.enterEmail"));
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // app.config scheme: "forlovers"; route group isimleri URL'de görünmez
                redirectTo: 'couply://reset-password',
            });

            if (error) throw error;

            setSent(true);
            Alert.alert(
                t("auth.resetEmailSentTitle"),
                t("auth.resetEmailSentMessage")
            );
        } catch (error: any) {
            Alert.alert(t("common.error"), error.message || t("auth.genericError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-bgLight">
                    <View className="px-4 pt-4">
                        <Pressable 
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center rounded-full bg-white border border-slate-100"
                        >
                            <Ionicons name="chevron-back" size={24} color="#0F172A" />
                        </Pressable>
                    </View>

                    <KeyboardAwareScrollView
                        enableOnAndroid
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            flexGrow: 1,
                            paddingHorizontal: 18,
                        }}
                    >
                        <View className="items-center pt-8">
                            <View className="justify-center items-center">
                                <Image
                                    source={Icons.infinity}
                                    className="w-[80px] h-[80px]"
                                    resizeMode="contain"
                                />
                                <Image
                                    source={Icons.heart}
                                    className="w-[28px] h-[28px] absolute"
                                    resizeMode="contain"
                                />
                            </View>

                            <View className="items-center mt-4">
                                <Text className="text-2xl font-black text-bgDark" style={{ fontFamily: 'InterBlack' }}>
                                    {t("auth.forgotTitle")}
                                </Text>
                                <Text className="mt-2 text-slate-500 text-center text-sm px-4">
                                    {sent 
                                        ? t("auth.forgotSentDesc")
                                        : t("auth.forgotDesc")}
                                </Text>
                            </View>
                        </View>

                        <View className="pt-10 gap-y-6">
                            <TextInputArea
                                label={t("auth.email")}
                                value={email}
                                onChangeText={setEmail}
                                placeholder={t("auth.emailPlaceholder")}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!sent}
                            />

                            <PrimaryButton
                                title={sent ? t("auth.resendLink") : t("auth.sendLink")}
                                loading={loading}
                                onPress={handleResetRequest}
                            />

                            <Pressable 
                                onPress={() => router.back()}
                                className="items-center pt-2"
                            >
                                <Text className="text-primary font-bold text-sm">
                                    {t("auth.backToLogin")}
                                </Text>
                            </Pressable>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </TouchableWithoutFeedback>
        </Screen>
    );
}
