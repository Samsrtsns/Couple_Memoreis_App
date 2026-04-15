import { Icons } from "@/assets/icons";
import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { useAuth } from "@/src/context/AuthContext";
import { useLogin } from "@/src/hooks/useLogin";
import { getProfileWithPartner } from "@/src/services/pairService";
import { signInWithGoogle } from "@/src/services/auth/googleAuth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Image,
    Platform,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function LoginScreen() {
    const { t } = useTranslation();
    const { enterGuestMode, dispatch } = useAuth();
    const {
        email,
        setEmail,
        pass,
        setPass,
        showPass,
        setShowPass,
        loading,
        handleLogin,
    } = useLogin();

    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithGoogle({
                setLoading: setGoogleLoading,
            });
            if (!result) return;

            const { profile, partner } = await getProfileWithPartner(result.user.id);
            dispatch({
                type: "LOGIN_SUCCESS",
                payload: {
                    session: result.session,
                    user: result.user,
                    profile,
                    partner,
                },
            });
            await AsyncStorage.setItem("hasLaunched", "true");
        } catch (e: unknown) {
            Alert.alert(
                t("common.error"),
                e instanceof Error ? e.message : t("auth.genericError"),
            );
        }
    };

    const handleGuestMode = async () => {
        await AsyncStorage.setItem('hasLaunched', 'true');
        enterGuestMode();
        router.replace('/(tabs)/home');
    };

    return (
        <Screen>
            <View className="flex-1 bg-bgLight">
                <KeyboardAwareScrollView
                    enableOnAndroid
                    extraScrollHeight={-100}
                    extraHeight={0}
                    keyboardOpeningTime={0}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 18,
                        paddingTop: 0,
                        paddingBottom: 0,
                    }}
                >
                    <View>
                        {/* Header */}
                        <View className="items-center pt-6">
                            <View className="justify-center items-center pb-2">
                                <Image
                                    source={require("@/assets/images/app_icon_png.png")}
                                    className="w-[130px] h-[130px]"
                                    resizeMode="contain"
                                />
                            </View>

                            <View className="items-center">
                                <Text className="text-3xl font-black tracking-tight text-bgDark" style={{ fontFamily: 'InterBlack' }}>
                                    forLovers
                                </Text>
                                <Text className="mt-1 text-slate-400 text-center text-sm">
                                    {t("auth.appTagline")}
                                </Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="pt-8">
                            <View className="gap-y-6 w-full">
                                <TextInputArea
                                    label={t("auth.email")}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder={t("auth.emailPlaceholder")}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                <View className="gap-y-2">
                                    <TextInputArea
                                        label={t("auth.password")}
                                        value={pass}
                                        onChangeText={setPass}
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

                                    <View className="items-end px-1">
                                        <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                                            <Text className="text-sm font-medium text-primary">
                                                {t("auth.forgotPassword")}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>

                                <PrimaryButton
                                    title={t("auth.login")}
                                    loading={loading}
                                    onPress={handleLogin}
                                />

                                <View className="flex-row items-center gap-x-4 pt-4 px-1">
                                    <View className="h-[1px] flex-1 bg-slate-200" />
                                    <Text className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                        {t("auth.continueWith")}
                                    </Text>
                                    <View className="h-[1px] flex-1 bg-slate-200" />
                                </View>

                                <Pressable
                                    onPress={handleGoogleSignIn}
                                    disabled={googleLoading}
                                    className="h-14 border border-slate-200 bg-white rounded-xl flex-row items-center justify-center gap-x-2"
                                    style={{ opacity: googleLoading ? 0.5 : 1 }}
                                >
                                    <Image source={Icons.google} className="w-5 h-5" />
                                    <Text className="font-semibold text-slate-700">
                                        {googleLoading ? "..." : "Google"}
                                    </Text>
                                </Pressable>

                                {/* Guest Mode Button */}
                                <TouchableOpacity
                                    onPress={handleGuestMode}
                                    activeOpacity={0.7}
                                    style={{
                                        height: 56,
                                        borderWidth: 1,
                                        borderStyle: "dashed",
                                        borderColor: "#CBD5E1",
                                        backgroundColor: "#F8FAFC",
                                        borderRadius: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                    }}
                                >
                                    <Ionicons name="glasses-outline" size={20} color="#64748B" />
                                    <Text className="font-semibold text-slate-500 text-sm">
                                        {t("auth.guestMode")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="pb-12 pt-8 items-center flex-row justify-center">
                            <Text className="text-slate-400 text-sm font-medium">{t("auth.noAccount")} </Text>

                            <Pressable
                                onPress={() => router.push("/(auth)/register")}
                                android_ripple={{ color: "transparent" }}
                                style={({ pressed }) => [
                                    {
                                        opacity: pressed && Platform.OS === "ios" ? 0.7 : 1,
                                    },
                                ]}
                            >
                                <Text className="text-primary font-bold text-sm">{t("auth.signup")}</Text>
                            </Pressable>
                        </View>

                    </View>
                </KeyboardAwareScrollView>
            </View>
        </Screen>
    );
}