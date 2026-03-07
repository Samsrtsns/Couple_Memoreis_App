import { Icons } from "@/assets/icons";
import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, Keyboard, Pressable, ScrollView, Text, View } from "react-native";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);

    return (
        <Screen>
            <ScrollView className="flex-1">
                <Pressable className="flex-1" onPress={Keyboard.dismiss}>
                    <View className="flex-col bg-bgLight px-6">
                        {/* Header */}
                        <View className="items-center pt-6">
                            <View className=" justify-center items-center">
                                <Image
                                    source={Icons.infinity}
                                    className="w-[100px] h-[100px]"
                                    resizeMode="contain"
                                />
                                <Image
                                    source={Icons.heart}
                                    className="w-[36px] h-[36px] absolute "
                                    resizeMode="contain"
                                />
                            </View>

                            <View className="flex-col justify-center items-center ">
                                <Text className="text-3xl font-bold tracking-tight text-bgDark">
                                    Couply
                                </Text>

                                <Text className="mt-2 text-slate400 ">
                                    Keep your memories with your lover
                                </Text>
                            </View>
                        </View>

                        {/* Form */}
                        <View className="pt-8">
                            <View className="gap-y-6 w-full">
                                {/* Email */}
                                <TextInputArea
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder="hello@ourlove.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />

                                {/* Password */}
                                <View className="gap-y-2">
                                    <TextInputArea
                                        label="Password"
                                        value={pass}
                                        onChangeText={setPass}
                                        placeholder="••••••••"
                                        secureTextEntry={!showPass}
                                        right={
                                            <Text className="text-slate400 ">
                                                {showPass ? "👁️" : "🙈"}
                                            </Text>
                                        }
                                        onRightPress={() => setShowPass((s) => !s)}
                                    />

                                    <View className="items-end px-1">
                                        <Pressable onPress={() => { }}>
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
                                <View className="flex-row items-center gap-x-4 pt-4 px-1">
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
                        </View>

                        {/* Footer */}
                        <View className="pb-12 pt-8 items-center">
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
                </Pressable>
            </ScrollView>
        </Screen>
    );
}