import { Icons } from "@/assets/icons";
import PrivacyPolicyModal from "@/src/components/PrivacyPolicyModal";
import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { useRegister } from "@/src/hooks/useRegister";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Image,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function RegisterScreen() {
    const { t } = useTranslation();
    const {
        firstName,
        setFirstName,
        lastName,
        setLastName,
        email,
        setEmail,
        accepted,
        setAccepted,
        password,
        setPass,
        showPass,
        setShowPass,
        loading,
        handleRegister,
    } = useRegister();

    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const handleAcceptTerms = () => {
        setAccepted(true);
        setShowPrivacyModal(false);
    };

    return (
        <Screen>
            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={-40}
                extraHeight={0}
                keyboardOpeningTime={0}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingBottom: 24,
                }}
            >
                <View className="bg-bgLight pt-4">
                    {/* Back Button */}
                    <Pressable
                        onPress={() => router.back()}
                        className="px-5 mb-6 self-start"
                    >
                        <Image
                            source={Icons.leftArrow}
                            className="w-7 h-7"
                            resizeMode="contain"
                        />
                    </Pressable>

                    {/* Title */}
                    <View className="px-6 pt-1 pb-8">
                        <Text className="text-[36px] font-extrabold leading-tight text-bgDark" style={{ fontFamily: 'InterBlack' }}>
                            {t("auth.registerTitle1")}{"\n"}
                            <Text className="text-primary">{t("auth.registerTitle2")}</Text>
                        </Text>

                        <Text className="text-slate-500 text-base font-medium leading-relaxed pt-2">
                            {t("auth.registerSubtitle")}
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="px-6 gap-y-6">
                        <TextInputArea
                            label={t("auth.firstName")}
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder={t("auth.firstNamePlaceholder")}
                            keyboardType="default"
                            autoCapitalize="words"
                        />

                        <TextInputArea
                            label={t("auth.lastName")}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder={t("auth.lastNamePlaceholder")}
                            keyboardType="default"
                            autoCapitalize="words"
                        />

                        <TextInputArea
                            label={t("auth.email")}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="merhaba@askimiz.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInputArea
                            label={t("auth.password")}
                            value={password}
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

                        {/* Terms */}
                        <View className="flex-row items-center gap-x-3 py-1">
                            <Pressable
                                onPress={() => setAccepted((v) => !v)}
                                className={[
                                    "w-5 h-5 rounded-full border items-center justify-center",
                                    accepted
                                        ? "bg-primary border-primary"
                                        : "bg-white border-slate-200",
                                ].join(" ")}
                            >
                                {accepted ? (
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                ) : null}
                            </Pressable>

                            <Text className="text-[13px] text-slate-500 font-medium flex-1">
                                {t("auth.acceptTermsPrefix")}
                                <Text
                                    onPress={() => setShowPrivacyModal(true)}
                                    className="text-slate-900 font-bold underline"
                                >
                                    {t("auth.termsAndPrivacy")}
                                </Text>
                                {t("auth.acceptTermsSuffix")}
                            </Text>
                        </View>

                        <PrimaryButton
                            title={t("auth.createAccount")}
                            loading={loading}
                            onPress={handleRegister}
                        />

                        {/* Divider */}
                        <View className="flex-row items-center gap-x-4 pt-2 px-1">
                            <View className="h-[1px] flex-1 bg-slate-200" />
                            <Text className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                                {t("auth.continueWith")}
                            </Text>
                            <View className="h-[1px] flex-1 bg-slate-200" />
                        </View>

                        {/* Social Buttons */}
                        <View className="flex-row gap-x-4">
                            <Pressable
                                onPress={() => { }}
                                className="flex-1 h-14 border border-slate-200 bg-white rounded-xl flex-row items-center justify-center gap-x-2"
                            >
                                <Image source={Icons.google} className="w-5 h-5" />
                                <Text className="font-semibold text-slate-700">Google</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => { }}
                                className="flex-1 h-14 border border-slate-200 bg-white rounded-xl flex-row items-center justify-center gap-x-2"
                            >
                                <Image source={Icons.apple} className="w-5 h-5" />
                                <Text className="font-semibold text-slate-700">Apple</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="pt-10 pb-6 items-center px-6 flex-row justify-center">
                        <Text className="text-slate-400 text-sm font-medium">
                            {t("auth.alreadyHaveAccount")}{" "}
                        </Text>

                        <Pressable
                            onPress={() => router.back()}
                            android_ripple={{ color: "transparent" }}
                            style={({ pressed }) => [
                                {
                                    opacity: pressed && Platform.OS === "ios" ? 0.7 : 1,
                                },
                            ]}
                        >
                            <Text className="text-primary font-bold text-sm">{t("auth.backToLoginCta")}</Text>
                        </Pressable>
                    </View>

                </View>
            </KeyboardAwareScrollView>

            <PrivacyPolicyModal 
                visible={showPrivacyModal} 
                onClose={() => setShowPrivacyModal(false)}
                onAccept={handleAcceptTerms}
            />
        </Screen>
    );
}

