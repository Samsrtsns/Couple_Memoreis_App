import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function RegisterScreen() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false} >
                <View className="flex-1 bg-bgLight mt-12">
                    {/* Title */}
                    <View className="px-8 pt-2 pb-8">
                        <Text className="text-[36px] font-extrabold leading-tight text-bgDark">
                            Save yours{"\n"}
                            <Text className="text-primary">memories.</Text>
                        </Text>

                        <Text className="text-slate500 text-base font-medium leading-relaxed pt-2">
                            Preserve every moment together in your shared digital sanctuary.
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="px-8 gap-y-6">
                        {/* Full Name */}
                        <TextInputArea
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Samet..."
                            keyboardType="default"
                            autoCapitalize="none"
                        />

                        {/* Full Name */}
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
                            value={pass}
                            onChangeText={setPass}
                            placeholder="••••••••"
                            secureTextEntry={!showPass}
                            right={
                                <Text className="text-slate400 text-base">
                                    {showPass ? "👁️" : "🙈"}
                                </Text>
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