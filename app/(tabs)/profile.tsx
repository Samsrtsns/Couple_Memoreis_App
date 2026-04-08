import PrimaryButton from "@/src/components/PrimaryButton";
import ProfileAvatar from "@/src/components/ProfileAvatar";
import { useAuth } from "@/src/context/AuthContext";
import { useProfile } from "@/src/hooks/useProfile";
import { isPremiumUser } from "@/src/utils/photoLimitUtils";
import { logoutUser } from "@/src/services/authService";
import {
    compressImage,
    deleteProfilePhoto,
    pickImage,
    updateProfileAvatar
} from "@/src/services/profilePhotoService";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View
} from "react-native";

type SettingsRowProps = {
    icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap;
    iconType?: "ion" | "material";
    iconBg: string;
    iconColor: string;
    title: string;
    onPress?: () => void;
    withBorder?: boolean;
};

function SettingsRow({
    icon,
    iconType = "ion",
    iconBg,
    iconColor,
    title,
    onPress,
    withBorder = true,
}: SettingsRowProps) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center justify-between px-4 py-4 ${withBorder ? "border-b border-slate-100" : ""
                }`}
        >
            <View className="flex-row items-center gap-x-4">
                <View
                    className="w-11 h-11 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: iconBg }}
                >
                    {iconType === "ion" ? (
                        <Ionicons
                            name={icon as keyof typeof Ionicons.glyphMap}
                            size={20}
                            color={iconColor}
                        />
                    ) : (
                        <MaterialIcons
                            name={icon as keyof typeof MaterialIcons.glyphMap}
                            size={20}
                            color={iconColor}
                        />
                    )}
                </View>

                <Text className="text-slate-700 font-semibold text-[15px]">
                    {title}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </Pressable>
    );
}

export default function ProfileScreen() {
    const { profile, partner, loading } = useProfile();
    const { state, dispatch, refreshProfile } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "Ayarlanmadı";

        const date = new Date(dateString);

        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const relationshipText = useMemo(() => {
        if (!partner || !profile?.relationship_start_date) return null;
        return `Together since ${formatDate(profile.relationship_start_date)}`;
    }, [partner, profile?.relationship_start_date]);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logoutUser();
        } catch {
            // logoutUser handles its own fallback; this is purely defensive
        } finally {
            dispatch({ type: 'LOGOUT' });
            router.replace("/(auth)/login");
            setIsLoggingOut(false);
        }
    };

    const handlePhotoOptions = () => {
        if (!state.session?.user) return;
        const options = ['Cancel', 'Change Photo'];
        const destructiveButtonIndex = profile?.avatar_url ? 2 : undefined;
        if (profile?.avatar_url) {
            options.push('Remove Photo');
        }

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 0,
                    destructiveButtonIndex,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleUploadPhoto();
                    } else if (buttonIndex === 2 && profile?.avatar_url) {
                        handleRemovePhoto();
                    }
                }
            );
        } else {
            Alert.alert(
                'Profil Fotoğrafı',
                'Bir seçenek belirleyin',
                [
                    { text: 'Fotoğrafı Değiştir', onPress: handleUploadPhoto },
                    ...(profile?.avatar_url ? [{ text: 'Fotoğrafı Kaldır', onPress: handleRemovePhoto, style: 'destructive' as const }] : []),
                    { text: 'İptal', style: 'cancel' }
                ]
            );
        }
    };

    const handleUploadPhoto = async () => {
        try {
            if (!state.session?.user) return;
            const uri = await pickImage();
            if (!uri) return;

            setIsUpdatingPhoto(true);
            const compressed = await compressImage(uri);
            await updateProfileAvatar(state.session.user.id, compressed, profile?.avatar_path);

            await refreshProfile();
        } catch (error: any) {
            Alert.alert("Yükleme Başarısız", error.message || "Fotoğraf yüklenemedi");
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const handleRemovePhoto = async () => {
        const userId = state.session?.user?.id;
        if (!userId || !profile?.avatar_path) return;

        Alert.alert(
            "Fotoğrafı Kaldır",
            "Profil fotoğrafını kaldırmak istediğinden emin misin?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Kaldır",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsUpdatingPhoto(true);
                            await deleteProfilePhoto(userId, profile.avatar_path!);
                            await refreshProfile();
                        } catch (error: any) {
                            Alert.alert("Hata", error.message || "Fotoğraf kaldırılamadı");
                        } finally {
                            setIsUpdatingPhoto(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-bgLight">
                <ActivityIndicator size="large" color="#ea5385" />
            </View>
        );
    }

    return (
        <View className="flex-col justify-center bg-bgLight flex-1">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Profile Top */}
                <View className="px-6 pt-8 pb-4 mt-12">
                    <View className="items-center">
                        <View className="items-center gap-y-4">
                            {/* Avatar */}
                            <View className="relative">
                                <Pressable onPress={handlePhotoOptions} disabled={isUpdatingPhoto}>
                                    <View>
                                        <ProfileAvatar
                                            url={profile?.avatar_url}
                                            size={128}
                                        />
                                        {isUpdatingPhoto && (
                                            <View className="absolute inset-0 bg-black/30 rounded-full items-center justify-center">
                                                <ActivityIndicator color="white" />
                                            </View>
                                        )}
                                    </View>
                                </Pressable>

                                <Pressable
                                    onPress={handlePhotoOptions}
                                    disabled={isUpdatingPhoto}
                                    className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-rose-500 items-center justify-center border-2 border-white"
                                >
                                    <MaterialIcons name="edit" size={18} color="white" />
                                </Pressable>
                            </View>

                            {/* Name and relation */}
                            <View className="items-center">
                                <Text className="text-slate-900 text-2xl font-extrabold text-center">
                                    {profile ? `${profile.first_name} ${profile.last_name}` : ""}
                                </Text>

                                {partner && (
                                    <View className="mt-3 flex-row items-center gap-x-1.5 bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                                        <Ionicons name="heart" size={14} color="#F43F5E" />
                                        <Text className="text-rose-500 text-[11px] font-bold uppercase tracking-[1px]">
                                            {partner.first_name} {partner.last_name} ile bağlı
                                        </Text>
                                    </View>
                                )}

                                {partner && profile?.relationship_start_date && (
                                    <View className="mt-4 flex-row items-center gap-x-1.5">
                                        <MaterialIcons name="calendar-today" size={15} color="#94A3B8" />
                                        <Text className="text-slate-500 text-sm font-medium">
                                            {formatDate(profile.relationship_start_date)} tarihinden beri beraber
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pairing Card - only show if no partner */}
                {!partner && (
                    <View className="px-6 py-4">
                        <View className="rounded-[24px] bg-rose-50 border border-rose-100 px-6 py-6 items-center">
                            <View className="items-center">
                                <Text className="text-rose-900 text-base font-bold">
                                    Partner Bağlantısı
                                </Text>
                                <Text className="text-rose-700/70 text-sm font-medium text-center leading-5 mt-1 max-w-[240px]">
                                    Partnerinle bağlanmak için sana özel eşleşme kodunu paylaş.
                                </Text>
                            </View>

                            <View className="w-full mt-5">
                                <PrimaryButton
                                    title="Eşleşme Kodunu Gör"
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(pairing)/pair",
                                            params: { from: "profile" },
                                        })
                                    }
                                />
                            </View>
                        </View>
                    </View>
                )}





                {!isPremiumUser(profile) && (
                    <View className="px-6 pt-2">
                        <Pressable
                            onPress={() => router.push("/(profile)/plan-limits")}
                            className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center gap-x-3">
                                <View className="w-10 h-10 rounded-xl bg-white items-center justify-center">
                                    <MaterialIcons
                                        name="workspace-premium"
                                        size={20}
                                        color="#D97706"
                                    />
                                </View>
                                <View>
                                    <Text className="text-amber-900 font-extrabold text-[14px]">
                                        Premium Ol
                                    </Text>
                                    <Text className="text-amber-700 text-[12px] font-medium">
                                        Plan ve limitleri incele
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#D97706" />
                        </Pressable>
                    </View>
                )}

                {/* Profile Settings */}
                <View className="mt-6">
                    <Text className="px-8 pb-3 text-slate-400 text-[11px] font-bold uppercase tracking-[1.5px]">
                        Profil Ayarları
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <SettingsRow
                            title="Kişisel Bilgiler"
                            iconType="ion"
                            icon="person-outline"
                            iconBg="#EFF6FF"
                            iconColor="#3B82F6"
                            onPress={() => router.push("/(profile)/personal-info")}
                        />
                        <SettingsRow
                            title="Hesap Ayarları"
                            iconType="ion"
                            icon="key-outline"
                            iconBg="#F0FDF4"
                            iconColor="#16A34A"
                            onPress={() => router.push("/(profile)/account-settings")}
                        />
                        <SettingsRow
                            title="İlişki Ayarları"
                            iconType="ion"
                            icon="heart"
                            iconBg="#FFF1F2"
                            iconColor="#F43F5E"
                            onPress={() => router.push("/(profile)/relationship")}
                        />
                        
                    </View>

                    {/* Account Settings */}
                    <Text className="px-8 pb-3 pt-8 text-slate-400 text-[11px] font-bold uppercase tracking-[1.5px]">
                        Hesap Ayarları
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <SettingsRow
                            title="Bildirim Tercihleri"
                            iconType="ion"
                            icon="notifications"
                            iconBg="#FFFBEB"
                            iconColor="#F59E0B"
                            onPress={() => router.push("/(profile)/notifications")}
                        />
                        <SettingsRow
                            title="Plan ve Limitler"
                            iconType="material"
                            icon="workspace-premium"
                            iconBg="#FFF7ED"
                            iconColor="#F59E0B"
                            withBorder={false}
                            onPress={() => router.push("/(profile)/plan-limits")}
                        />
                    </View>

                    {/* Security */}
                    <Text className="px-8 pb-3 pt-8 text-slate-400 text-[11px] font-bold uppercase tracking-[1.5px]">
                        Güvenlik ve Gizlilik
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <SettingsRow
                            title="Gizlilik Politikası"
                            iconType="ion"
                            icon="shield-checkmark-outline"
                            iconBg="#F8FAFC"
                            iconColor="#64748B"
                            withBorder={false}
                            onPress={() => router.push("/(profile)/privacy")}
                        />
                    </View>

                    {/* Footer */}
                    <View className="px-12 py-12 items-center justify-center">
                        <Text className="text-[11px] font-bold text-slate-300 uppercase tracking-[2px]">
                            Anı Arşivi v2.4.0
                        </Text>

                        <View className="mt-2 flex-row items-center gap-x-1.5 opacity-30">
                            <Ionicons name="heart" size={12} color="#64748B" />
                            <Text className="text-[10px] font-medium text-slate-500">
                                Çiftler için sevgiyle yapıldı
                            </Text>
                        </View>
                    </View>

                    {/* Logout */}
                    <View className="px-6">
                        <PrimaryButton
                            title="Çıkış Yap"
                            loading={isLoggingOut}
                            variant="secondary"
                            onPress={handleLogout}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}