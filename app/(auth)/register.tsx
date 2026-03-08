import { Icons } from "@/assets/icons";
import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { useRegister } from "@/src/hooks/useRegister";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Image,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function RegisterScreen() {
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
                        <Text className="text-[36px] font-extrabold leading-tight text-bgDark">
                            Save yours{"\n"}
                            <Text className="text-primary">memories.</Text>
                        </Text>

                        <Text className="text-slate500 text-base font-medium leading-relaxed pt-2">
                            Preserve every moment together in your shared digital sanctuary.
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="px-6 gap-y-6">
                        <TextInputArea
                            label="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            placeholder="exp: John"
                            keyboardType="default"
                            autoCapitalize="words"
                        />

                        <TextInputArea
                            label="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="exp: Doe"
                            keyboardType="default"
                            autoCapitalize="words"
                        />

                        <TextInputArea
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="hello@ourlove.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInputArea
                            label="Password"
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
                        <Pressable
                            onPress={() => setAccepted((v) => !v)}
                            className="flex-row items-center gap-x-3 py-1"
                        >
                            <View
                                className={[
                                    "w-5 h-5 rounded-full border items-center justify-center",
                                    accepted
                                        ? "bg-primary border-primary"
                                        : "bg-white border-slate200",
                                ].join(" ")}
                            >
                                {accepted ? (
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                ) : null}
                            </View>

                            <Text className="text-[13px] text-slate500 font-medium flex-1">
                                I agree to the{" "}
                                <Text className="text-slate900 font-bold underline">
                                    Terms & Privacy
                                </Text>
                            </Text>
                        </Pressable>

                        <PrimaryButton
                            title="Create Account"
                            loading={loading}
                            onPress={handleRegister}
                        />

                        {/* Divider */}
                        <View className="flex-row items-center gap-x-4 pt-2 px-1">
                            <View className="h-[1px] flex-1 bg-slate200" />
                            <Text className="text-xs font-medium text-slate400 uppercase tracking-widest">
                                Or continue with
                            </Text>
                            <View className="h-[1px] flex-1 bg-slate200" />
                        </View>

                        {/* Social Buttons */}
                        <View className="flex-row gap-x-4">
                            <Pressable
                                onPress={() => { }}
                                className="flex-1 h-14 border border-slate200 bg-white rounded-xl flex-row items-center justify-center gap-x-2"
                            >
                                <Image source={Icons.google} className="w-5 h-5" />
                                <Text className="font-semibold text-slate700">Google</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => { }}
                                className="flex-1 h-14 border border-slate200 bg-white rounded-xl flex-row items-center justify-center gap-x-2"
                            >
                                <Image source={Icons.apple} className="w-5 h-5" />
                                <Text className="font-semibold text-slate700">Apple</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="pt-10 pb-6 items-center px-6 flex-row justify-center">
                        <Text className="text-slate400 text-sm font-medium">
                            Already have an account?{" "}
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
                            <Text className="text-primary font-bold text-sm">Log In →</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAwareScrollView>
        </Screen>
    );
}

