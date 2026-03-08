import { Icons } from "@/assets/icons";
import PrimaryButton from "@/src/components/PrimaryButton";
import Screen from "@/src/components/Screen";
import { TextInputArea } from "@/src/components/TextInput";
import { useLogin } from "@/src/hooks/useLogin";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    Image,
    Keyboard,
    Platform,
    Pressable,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function LoginScreen() {
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

    return (
        <Screen>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-bgLight">
                    <KeyboardAwareScrollView
                        enableOnAndroid
                        extraScrollHeight={-100}
                        extraHeight={0}
                        keyboardOpeningTime={0}
                        keyboardShouldPersistTaps="handled"
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
                                <View className="justify-center items-center">
                                    <Image
                                        source={Icons.infinity}
                                        className="w-[100px] h-[100px]"
                                        resizeMode="contain"
                                    />
                                    <Image
                                        source={Icons.heart}
                                        className="w-[36px] h-[36px] absolute"
                                        resizeMode="contain"
                                    />
                                </View>

                                <View className="items-center">
                                    <Text className="text-3xl font-bold tracking-tight text-bgDark">
                                        Couply
                                    </Text>

                                    <Text className="mt-2 text-slate400 text-center">
                                        Keep your memories with your lover
                                    </Text>
                                </View>
                            </View>

                            {/* Form */}
                            <View className="pt-8">
                                <View className="gap-y-6 w-full">
                                    <TextInputArea
                                        label="Email"
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="hello@ourlove.com"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />

                                    <View className="gap-y-2">
                                        <TextInputArea
                                            label="Password"
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
                                            <Pressable onPress={() => { }}>
                                                <Text className="text-sm font-medium text-primary">
                                                    Forgot Password?
                                                </Text>
                                            </Pressable>
                                        </View>
                                    </View>

                                    <PrimaryButton
                                        title="Log In"
                                        loading={loading}
                                        onPress={handleLogin}
                                    />

                                    <View className="flex-row items-center gap-x-4 pt-4 px-1">
                                        <View className="h-[1px] flex-1 bg-slate200" />
                                        <Text className="text-xs font-medium text-slate400 uppercase tracking-widest">
                                            Or continue with
                                        </Text>
                                        <View className="h-[1px] flex-1 bg-slate200" />
                                    </View>

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
                            <View className="pb-12 pt-8 items-center flex-row justify-center">
                                <Text className="text-slate600">Don't have an account? </Text>

                                <Pressable
                                    onPress={() => router.push("/(auth)/register")}
                                    android_ripple={{ color: "transparent" }}
                                    style={({ pressed }) => [
                                        {
                                            opacity: pressed && Platform.OS === "ios" ? 0.7 : 1,
                                        },
                                    ]}
                                >
                                    <Text className="text-primary font-bold">Sign Up</Text>
                                </Pressable>
                            </View>
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </TouchableWithoutFeedback>
        </Screen>
    );
}