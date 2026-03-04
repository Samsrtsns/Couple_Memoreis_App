import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const [showPass, setShowPass] = useState(false);

    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    return (
        <Screen   >
            <View className="flex-col bg-bgLight h-full ">
                {/* Header */}
                <View className="items-center pt-12 pb-6 px-6">
                    <View className="bg-primary/10 p-3 rounded-full mb-4">
                        {/* icon yerine kalp emoji kullandım; istersen lucide-react-native ile ikon yaparız */}
                        <Text className="text-primary text-2xl">♥</Text>
                    </View>

                    <Text className="text-3xl font-bold tracking-tight text-center text-bgDark">
                        Couplely
                    </Text>

                    <Text className="mt-2 text-slate400 text-center">
                        Keep your memories with your lover.
                    </Text>
                </View>

                {/* Form */}
                <View className="flex-col px-6 w-full">
                    <View className="gap-y-6">
                        {/* Email */}
                        <View className="gap-y-2">
                            <Text className="text-sm font-semibold ml-1 text-slate700">
                                Email
                            </Text>

                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="hello@ourlove.com"
                                placeholderTextColor="#94A3B8"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                className={[
                                    "w-full h-14 bg-white border rounded-xl px-4 text-base text-slate900",
                                    emailFocused ? "border-primary" : "border-slate200",
                                ].join(" ")}
                            />
                        </View>

                        {/* Password */}
                        <View className="gap-y-2">
                            <Text className="text-sm font-semibold ml-1 text-slate700">
                                Password
                            </Text>

                            <View className="relative justify-center">
                                <TextInput
                                    value={pass}
                                    onChangeText={setPass}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showPass}
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                    className={[
                                        "w-full h-14 bg-white border rounded-xl px-4 pr-12 text-base text-slate900",
                                        passFocused ? "border-primary" : "border-slate200",
                                    ].join(" ")}
                                />

                                <Pressable
                                    onPress={() => setShowPass((s) => !s)}
                                    className="absolute right-4"
                                >
                                    <Text className="text-slate400 text-base">
                                        {showPass ? "🙈" : "👁️"}
                                    </Text>
                                </Pressable>
                            </View>

                            <View className="items-end px-1">
                                <Pressable onPress={() => { /* forgot flow */ }}>
                                    <Text className="text-sm font-medium text-primary">
                                        Forgot Password?
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Login Button */}
                        <PrimaryButton
                            title="Log In"
                            onPress={() => router.replace("/(tabs)/home")}
                        />

                        {/* Divider */}
                        <View className="flex-row items-center gap-x-4 py-4">
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
                                <Image className="w-5 h-5" />
                                <Text className="font-semibold text-slate700">Google</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => { }}
                                className="flex-1 h-14 border border-slate200 bg-white rounded-xl flex-row items-center justify-center gap-x-2"
                            >
                                <Image className="w-5 h-5" />
                                <Text className="font-semibold text-slate700">Apple</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View className="pb-12 pt-6 items-center px-6">
                    <Text className="text-slate600">
                        Don't have an account?{" "}
                        <Text
                            className="text-primary font-bold"
                            onPress={() => router.push("/(auth)/register")}
                        >
                            Sign Up
                        </Text>
                    </Text>
                </View>
            </View>
        </Screen>
    );
}