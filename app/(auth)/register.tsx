import Screen from "@/src/components/Screen";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function RegisterScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    const [showPass, setShowPass] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const [nameFocused, setNameFocused] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false} >
                <View className="flex-1 bg-bgLight">
                    {/* Top sticky bar */}
                    <View className="px-4 py-3 flex-row items-center justify-between">
                        <Pressable
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center active:opacity-60"
                        >
                            <Text className="text-2xl text-bgDark">‹</Text>
                        </Pressable>

                        <Text className="text-slate400 text-[11px] font-bold tracking-[3px] uppercase">
                            Join the Archive
                        </Text>

                        <View className="w-10 h-10" />
                    </View>

                    {/* Glass header */}
                    <View className="px-6 pt-2 pb-6">
                        <View className="w-full h-[220px] rounded-[40px] overflow-hidden items-center justify-center relative">
                            {/* background glass gradient */}
                            <LinearGradient
                                colors={[
                                    "rgba(255,192,203,0.40)",
                                    "rgba(255,127,110,0.20)",
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ position: "absolute", inset: 0 }}
                            />

                            {/* blur circles (RN blur yoksa da güzel durur) */}
                            <View className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-pink-300/40" />
                            <View className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-primary/25" />
                            <View className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white/35 -translate-x-12 -translate-y-12" />

                            {/* icon area */}
                            <View className="items-center justify-center opacity-30">
                                <Text className="text-[92px] text-primary">∞</Text>
                                <Text className="absolute text-[56px] text-primary/80">♥</Text>
                            </View>
                        </View>
                    </View>

                    {/* Title */}
                    <View className="px-8 pt-2 pb-8">
                        <Text className="text-[36px] font-extrabold leading-tight text-bgDark">
                            Create your{"\n"}
                            <Text className="text-primary">archive.</Text>
                        </Text>

                        <Text className="text-slate500 text-base font-medium leading-relaxed pt-2">
                            Preserve every moment together in your shared digital sanctuary.
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="px-8 gap-y-6">
                        {/* Full Name */}
                        <View className="gap-y-2">
                            <Text className="text-slate400 text-[11px] font-bold tracking-widest uppercase ml-1">
                                Full Name
                            </Text>

                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Alex Sterling"
                                placeholderTextColor="#CBD5E1"
                                onFocus={() => setNameFocused(true)}
                                onBlur={() => setNameFocused(false)}
                                className={[
                                    "h-12 rounded-2xl px-5 text-slate900 text-sm font-medium bg-white/60 border",
                                    nameFocused ? "border-primary" : "border-slate200",
                                ].join(" ")}
                            />
                        </View>

                        {/* Email */}
                        <View className="gap-y-2">
                            <Text className="text-slate400 text-[11px] font-bold tracking-widest uppercase ml-1">
                                Email Address
                            </Text>

                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@archive.com"
                                placeholderTextColor="#CBD5E1"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                className={[
                                    "h-12 rounded-2xl px-5 text-slate900 text-sm font-medium bg-white/60 border",
                                    emailFocused ? "border-primary" : "border-slate200",
                                ].join(" ")}
                            />
                        </View>

                        {/* Password */}
                        <View className="gap-y-2">
                            <Text className="text-slate400 text-[11px] font-bold tracking-widest uppercase ml-1">
                                Password
                            </Text>

                            <View className="relative justify-center">
                                <TextInput
                                    value={pass}
                                    onChangeText={setPass}
                                    placeholder="Create a strong password"
                                    placeholderTextColor="#CBD5E1"
                                    secureTextEntry={!showPass}
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                    className={[
                                        "h-12 rounded-2xl px-5 pr-12 text-slate900 text-sm font-medium bg-white/60 border",
                                        passFocused ? "border-primary" : "border-slate200",
                                    ].join(" ")}
                                />

                                <Pressable
                                    onPress={() => setShowPass((s) => !s)}
                                    className="absolute right-4"
                                >
                                    <Text className="text-slate300 text-base">
                                        {showPass ? "🙈" : "👁️"}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Terms */}
                        <Pressable
                            onPress={() => setAccepted((v) => !v)}
                            className="flex-row items-center gap-x-3 py-1"
                        >
                            <View
                                className={[
                                    "w-5 h-5 rounded-full border items-center justify-center",
                                    accepted ? "bg-primary border-primary" : "bg-white border-slate200",
                                ].join(" ")}
                            >
                                {accepted ? <Text className="text-white text-[12px]">✓</Text> : null}
                            </View>

                            <Text className="text-[13px] text-slate500 font-medium flex-1">
                                I agree to the{" "}
                                <Text className="text-slate900 font-bold underline">
                                    Terms & Privacy
                                </Text>
                            </Text>
                        </Pressable>

                        {/* Create Account Button */}
                        <View className="pt-4">
                            <Pressable
                                disabled={!accepted}
                                onPress={() => router.replace("/(tabs)/home")}
                                className={[
                                    "h-14 rounded-2xl overflow-hidden",
                                    !accepted ? "opacity-50" : "opacity-100",
                                ].join(" ")}
                            >
                                <LinearGradient
                                    colors={["#FF9B8E", "#FF7F6E", "#E65D4F"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                                >
                                    <View className="flex-row items-center gap-x-2">
                                        <Text className="text-white font-bold text-base">
                                            Create Account
                                        </Text>
                                        <Text className="text-white text-lg">→</Text>
                                    </View>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </View>

                    {/* Footer */}
                    <View className="mt-auto pt-10 pb-12 items-center px-6">
                        <Text className="text-slate400 text-sm font-medium">
                            Already have an account?
                            <Text
                                className="text-primary font-bold"
                                onPress={() => router.back()}
                            >
                                {" "}
                                Log In →
                            </Text>
                        </Text>
                    </View>

                    <View className="h-6" />
                </View>
            </ScrollView>
        </Screen>
    );
}