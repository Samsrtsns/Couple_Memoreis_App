import { useAuth } from "@/src/context/AuthContext";
import { changePasswordWithCurrent } from "@/src/services/authService";
import { deleteUserAccount } from "@/src/services/accountService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const MIN_PASSWORD_LEN = 6;

export default function AccountSettingsScreen() {
    const { state, dispatch } = useAuth();
    const email = state.user?.email ?? "";

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const canChangePassword = useMemo(() => {
        return (
            !!email.trim() &&
            currentPassword.length > 0 &&
            newPassword.length >= MIN_PASSWORD_LEN &&
            newPassword === confirmPassword
        );
    }, [email, currentPassword, newPassword, confirmPassword]);

    const handleChangePassword = async () => {
        if (!email) {
            Alert.alert("Hata", "Oturum bilgisi bulunamadı.");
            return;
        }
        if (newPassword.length < MIN_PASSWORD_LEN) {
            Alert.alert(
                "Hata",
                `Yeni şifre en az ${MIN_PASSWORD_LEN} karakter olmalıdır.`
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
            return;
        }
        if (newPassword === currentPassword) {
            Alert.alert("Hata", "Yeni şifre mevcut şifre ile aynı olamaz.");
            return;
        }

        setSavingPassword(true);
        try {
            await changePasswordWithCurrent({
                email: email.trim(),
                currentPassword,
                newPassword,
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            Alert.alert("Başarılı", "Şifreniz güncellendi.");
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Şifre güncellenemedi.";
            Alert.alert("Hata", msg);
        } finally {
            setSavingPassword(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Hesabı Sil",
            "Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm anılarınız, paylaştığınız yerler kalıcı olarak silinecektir.",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Evet, Sil",
                    style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteUserAccount();
                            dispatch({ type: "LOGOUT" });
                            // Tüm geçmiş ekranları kapatıp login'e git
                            (router as any).dismissAll?.();
                            router.replace("/(auth)/login");
                        } catch (error: unknown) {
                            const msg =
                                error instanceof Error
                                    ? error.message
                                    : "Hesap silinemedi.";
                            Alert.alert("Hata", msg);
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-[#FDF8F7]">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        padding: 24,
                        paddingTop: 12,
                        paddingBottom: 120,
                    }}
                >
                    <Text className="text-slate-500 text-sm mb-6">
                        Şifrenizi ve hesap güvenliğinizi buradan yönetin.
                    </Text>

                    <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-3 px-1">
                        Şifre değiştir
                    </Text>

                    <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm gap-y-5">
                        <View>
                            <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                                Mevcut şifre
                            </Text>
                            <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-100">
                                <TextInput
                                    className="flex-1 py-4 text-slate-800 font-semibold"
                                    placeholder="••••••••"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showCurrent}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowCurrent((v) => !v)}
                                    hitSlop={12}
                                >
                                    <Ionicons
                                        name={showCurrent ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color="#94A3B8"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View>
                            <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                                Yeni şifre
                            </Text>
                            <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-100">
                                <TextInput
                                    className="flex-1 py-4 text-slate-800 font-semibold"
                                    placeholder="En az 6 karakter"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showNew}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNew((v) => !v)}
                                    hitSlop={12}
                                >
                                    <Ionicons
                                        name={showNew ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color="#94A3B8"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View>
                            <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 ml-1">
                                Yeni şifre (tekrar)
                            </Text>
                            <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-100">
                                <TextInput
                                    className="flex-1 py-4 text-slate-800 font-semibold"
                                    placeholder="Yeni şifreyi tekrarlayın"
                                    placeholderTextColor="#94A3B8"
                                    secureTextEntry={!showConfirm}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirm((v) => !v)}
                                    hitSlop={12}
                                >
                                    <Ionicons
                                        name={showConfirm ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color="#94A3B8"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleChangePassword}
                        disabled={!canChangePassword || savingPassword}
                        className={`mt-8 h-16 rounded-[28px] items-center justify-center shadow-lg ${
                            !canChangePassword || savingPassword
                                ? "bg-slate-300"
                                : "bg-[#ea5385]"
                        }`}
                    >
                        {savingPassword ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">
                                Şifreyi Güncelle
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View className="mt-14 py-6 border-t border-slate-200">
                        <Text className="text-red-400 text-xs font-bold uppercase tracking-[2px] mb-4 text-center">
                            Tehlikeli bölge
                        </Text>
                        <TouchableOpacity
                            onPress={handleDeleteAccount}
                            disabled={deleting}
                            className="bg-white border border-red-100 h-14 rounded-2xl flex-row items-center justify-center gap-x-2"
                        >
                            {deleting ? (
                                <ActivityIndicator color="#ef4444" />
                            ) : (
                                <>
                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    <Text className="text-red-500 font-bold">
                                        Hesabımı kalıcı olarak sil
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text className="text-slate-300 text-[10px] text-center mt-3 px-4">
                            Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak temizlenecektir.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
