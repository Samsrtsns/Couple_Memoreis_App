import { usePair } from "@/src/hooks/usePair";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";

export default function PairScreen() {
    const {
        myCode,
        partnerCode,
        setPartnerCode,
        loading,
        copyCode,
        shareCode,
        connectPartner,
    } = usePair();

    const formattedCode = String(myCode || "")
        .replace(/\s/g, "")
        .split("")
        .join(" ");

    return (
        <View className="flex-1 items-center bg-bgLight">
            {/* Back Button */}
            <View className="flex-row w-full justify-start items-start mt-16 px-4">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/70 items-center justify-center"
                >
                    <Ionicons name="chevron-back" size={20} color="#0f172a" />
                </Pressable>
            </View>

            {/* Header and subhead text */}
            <View className="flex-col justify-center items-center w-full mt-4 gap-y-2 px-7">
                <Text className="text-center text-[26px] font-bold">
                    Better Together
                </Text>
                <Text className="text-center text-[14px] font-normal text-slate500">
                    Share your invate code or enter your partner&apos;s code to start your shared journey.
                </Text>
            </View>

            {/* Code Card */}
            <View className="w-full items-center mt-8 px-6">
                <View className="w-full h-[90%] max-h-[300px] bg-white rounded-3xl shadow-lg justify-center items-center">
                    <View className="flex-col items-center p-6 w-full h-full rounded-3xl">
                        <View className="w-20 h-20 rounded-full bg-[#ea5385]/20 items-center justify-center">
                            <Ionicons name="heart" size={30} color="#ea5385" />
                        </View>

                        <Text className="mt-6 text-[#ea5385] uppercase text-xs font-bold tracking-[2px]">
                            Your Invite Code
                        </Text>

                        <Text className="mt-6 font-bold text-[42px] text-slate-900 tracking-[6px]">
                            {formattedCode || "0 0 0 0 0 0"}
                        </Text>

                        {/* Actions */}
                        <View className="flex-row w-full gap-3 mt-8">
                            <Pressable
                                onPress={copyCode}
                                className="flex-1 h-12 rounded-2xl bg-slate-100 flex-row items-center justify-center"
                            >
                                <Ionicons name="copy-outline" size={18} color="#0f172a" />
                                <Text className="ml-2 text-slate-900 font-semibold">
                                    Copy
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={shareCode}
                                className="flex-1 h-12 rounded-2xl bg-[#ea5385] flex-row items-center justify-center"
                            >
                                <Ionicons name="share-social-outline" size={18} color="#ffffff" />
                                <Text className="ml-2 text-white font-semibold">
                                    Share
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
                {/* Divider */}
                <View className="flex-row items-center w-full gap-4 py-4 mt-8">
                    <View className="flex-1 h-[1px] bg-slate-200" />
                    <Text className="text-xs font-bold text-slate-400 uppercase tracking-[3px]">
                        Or Join Them
                    </Text>
                    <View className="flex-1 h-[1px] bg-slate-200" />
                </View>

                {/* Input Field Section */}
                <View className="w-full gap-y-4">
                    <View className="relative">
                        <TextInput
                            value={partnerCode}
                            onChangeText={setPartnerCode}
                            placeholder="Enter Partner's Code"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="characters"
                            className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-center text-lg font-semibold tracking-[4px] text-slate-900"
                        />
                    </View>

                    <Pressable
                        onPress={connectPartner}
                        disabled={loading}
                        className="w-full h-14 bg-[#ea5385]/10 rounded-xl flex-row items-center justify-center gap-2"
                    >
                        <Text className="text-[#ea5385] font-bold">
                            {loading ? "Connecting..." : "Connect Now"}
                        </Text>
                        <Ionicons name="link-outline" size={18} color="#ea5385" />
                    </Pressable>
                </View>

                {/* Footer Help */}
                <View className="w-full mt-24 mb-6 items-center">
                    <Text className="text-sm text-slate-500 text-center">
                        Need help?{" "}
                        <Text className="text-[#ea5385] font-bold">Visit our guide</Text>
                    </Text>
                </View>

            </View>
        </View>
    );
}

