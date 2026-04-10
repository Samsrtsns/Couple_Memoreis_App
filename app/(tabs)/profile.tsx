import PrimaryButton from "@/src/components/PrimaryButton";
import ProfileAvatar from "@/src/components/ProfileAvatar";
import { useAuth } from "@/src/context/AuthContext";
import { useProfile } from "@/src/hooks/useProfile";
import { isPremiumUser } from "@/src/utils/photoLimitUtils";
import { parseDateOnlyString } from "@/src/utils/dateUtils";
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
import { useTranslation } from "react-i18next";
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

/* ─── Guest Profile View ──────────────────────────────────────────────── */
function GuestProfileView() {
    const { t } = useTranslation();

    const handleGoToLogin = () => {
        router.push("/(auth)/login");
    };

    const handleGoToRegister = () => {
        router.push("/(auth)/register");
    };

    return (
        <View className="flex-col justify-center bg-bgLight flex-1">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* Guest Avatar & Info */}
                <View className="px-6 pt-8 pb-4 mt-12">
                    <View className="items-center">
                        <View className="items-center gap-y-4">
                            {/* Avatar Placeholder */}
                            <View className="w-[128px] h-[128px] rounded-full bg-slate-100 items-center justify-center border-2 border-dashed border-slate-300">
                                <Ionicons name="person-outline" size={48} color="#94A3B8" />
                            </View>

                            <View className="items-center">
                                <Text className="text-slate-900 text-2xl font-extrabold text-center">
                                    {t("guest.title")}
                                </Text>
                                <Text className="text-slate-400 text-sm font-medium text-center mt-1 max-w-[260px]">
                                    {t("guest.subtitle")}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CTA Card */}
                <View className="px-6 py-4">
                    <View className="rounded-[24px] bg-gradient-to-b from-rose-50 to-white border border-rose-100 px-6 py-8 items-center">
                        <View className="w-16 h-16 rounded-full bg-rose-100 items-center justify-center mb-4">
                            <Ionicons name="heart" size={28} color="#F43F5E" />
                        </View>

                        <Text className="text-rose-900 text-lg font-bold text-center">
                            {t("guest.ctaTitle")}
                        </Text>
                        <Text className="text-rose-700/70 text-sm font-medium text-center leading-5 mt-2 max-w-[280px]">
                            {t("guest.ctaSubtitle")}
                        </Text>

                        <View className="w-full mt-6 gap-y-3">
                            <PrimaryButton
                                title={t("guest.createAccount")}
                                onPress={handleGoToRegister}
                            />

                            <Pressable
                                onPress={handleGoToLogin}
                                className="h-14 border border-slate-200 bg-white rounded-2xl flex-row items-center justify-center gap-x-2"
                                style={({ pressed }) => [
                                    { opacity: pressed && Platform.OS === "ios" ? 0.7 : 1 },
                                ]}
                            >
                                <Ionicons name="log-in-outline" size={20} color="#F43F5E" />
                                <Text className="font-bold text-rose-500 text-[15px]">
                                    {t("guest.loginExisting")}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Feature Highlights */}
                <View className="mt-4">
                    <Text className="px-8 pb-3 text-slate-400 text-[11px] font-bold uppercase tracking-[1.5px]">
                        {t("guest.whatYouGet")}
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
                            <View className="w-11 h-11 rounded-2xl items-center justify-center bg-emerald-50">
                                <Ionicons name="images" size={20} color="#10B981" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-slate-700 font-semibold text-[14px]">
                                    {t("guest.featureMemories")}
                                </Text>
                                <Text className="text-slate-400 text-[12px] font-medium mt-0.5">
                                    {t("guest.featureMemoriesDesc")}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center px-4 py-4 border-b border-slate-100">
                            <View className="w-11 h-11 rounded-2xl items-center justify-center bg-blue-50">
                                <Ionicons name="map" size={20} color="#3B82F6" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-slate-700 font-semibold text-[14px]">
                                    {t("guest.featurePlaces")}
                                </Text>
                                <Text className="text-slate-400 text-[12px] font-medium mt-0.5">
                                    {t("guest.featurePlacesDesc")}
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row items-center px-4 py-4">
                            <View className="w-11 h-11 rounded-2xl items-center justify-center bg-rose-50">
                                <Ionicons name="people" size={20} color="#F43F5E" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-slate-700 font-semibold text-[14px]">
                                    {t("guest.featurePartner")}
                                </Text>
                                <Text className="text-slate-400 text-[12px] font-medium mt-0.5">
                                    {t("guest.featurePartnerDesc")}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View className="px-12 py-12 items-center justify-center">
                    <Text className="text-[11px] font-bold text-slate-300 uppercase tracking-[2px]">
                        Anı Arşivi v2.4.0
                    </Text>

                    <View className="mt-2 flex-row items-center gap-x-1.5 opacity-30">
                        <Ionicons name="heart" size={12} color="#64748B" />
                        <Text className="text-[10px] font-medium text-slate-500">
                            {t("profile.madeForCouples")}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

/* ─── Authenticated Profile View ──────────────────────────────────────── */
export default function ProfileScreen() {
    const { t, i18n } = useTranslation();
    const { state, dispatch, refreshProfile } = useAuth();
    const { profile, partner, loading } = useProfile();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return t("profile.notSet");

        const date = parseDateOnlyString(dateString);
        if (!date) return t("profile.notSet");

        return date.toLocaleDateString(i18n.language || "en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const relationshipText = useMemo(() => {
        if (!partner || !profile?.relationship_start_date) return null;
        return t("profile.togetherSince", { date: formatDate(profile.relationship_start_date) });
    }, [partner, profile?.relationship_start_date, i18n.language, t]);

    // Guest mode: show guest profile view (after all hooks to satisfy Rules of Hooks)
    if (state.isGuest) {
        return <GuestProfileView />;
    }

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
        const options = [t("common.cancel"), t("profile.photoChange")];
        const destructiveButtonIndex = profile?.avatar_url ? 2 : undefined;
        if (profile?.avatar_url) {
            options.push(t("profile.photoRemove"));
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
                t("profile.photoTitle"),
                t("profile.photoChooseOption"),
                [
                    { text: t("profile.photoChange"), onPress: handleUploadPhoto },
                    ...(profile?.avatar_url ? [{ text: t("profile.photoRemove"), onPress: handleRemovePhoto, style: 'destructive' as const }] : []),
                    { text: t("common.cancel"), style: 'cancel' }
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
            Alert.alert(t("profile.uploadFailed"), error.message || t("profile.uploadFailedMessage"));
        } finally {
            setIsUpdatingPhoto(false);
        }
    };

    const handleRemovePhoto = async () => {
        const userId = state.session?.user?.id;
        if (!userId || !profile?.avatar_path) return;

        Alert.alert(
            t("profile.removePhotoTitle"),
            t("profile.removePhotoConfirm"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("profile.remove"),
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsUpdatingPhoto(true);
                            await deleteProfilePhoto(userId, profile.avatar_path!);
                            await refreshProfile();
                        } catch (error: any) {
                            Alert.alert(t("common.error"), error.message || t("profile.removeFailedMessage"));
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
                                            {t("profile.connectedWith", { name: `${partner.first_name} ${partner.last_name}` })}
                                        </Text>
                                    </View>
                                )}

                                {partner && profile?.relationship_start_date && (
                                    <View className="mt-4 flex-row items-center gap-x-1.5">
                                        <MaterialIcons name="calendar-today" size={15} color="#94A3B8" />
                                        <Text className="text-slate-500 text-sm font-medium">
                                            {relationshipText}
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
                                    {t("profile.pairingTitle")}
                                </Text>
                                <Text className="text-rose-700/70 text-sm font-medium text-center leading-5 mt-1 max-w-[240px]">
                                    {t("profile.pairingSubtitle")}
                                </Text>
                            </View>

                            <View className="w-full mt-5">
                                <PrimaryButton
                                    title={t("profile.showPairCode")}
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
                                        {t("profile.becomePremium")}
                                    </Text>
                                    <Text className="text-amber-700 text-[12px] font-medium">
                                        {t("profile.checkPlans")}
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
                        {t("profile.profileSettings")}
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <SettingsRow
                            title={t("profile.personalInfo")}
                            iconType="ion"
                            icon="person-outline"
                            iconBg="#EFF6FF"
                            iconColor="#3B82F6"
                            onPress={() => router.push("/(profile)/personal-info")}
                        />
                        <SettingsRow
                            title={t("profile.accountSettings")}
                            iconType="ion"
                            icon="key-outline"
                            iconBg="#F0FDF4"
                            iconColor="#16A34A"
                            onPress={() => router.push("/(profile)/account-settings")}
                        />
                        <SettingsRow
                            title={t("profile.appSettings")}
                            iconType="ion"
                            icon="settings-outline"
                            iconBg="#EEF2FF"
                            iconColor="#6366F1"
                            onPress={() => router.push("/(profile)/app-settings")}
                        />
                        <SettingsRow
                            title={t("profile.relationshipSettings")}
                            iconType="ion"
                            icon="heart"
                            iconBg="#FFF1F2"
                            iconColor="#F43F5E"
                            onPress={() => router.push("/(profile)/relationship")}
                        />
                        
                    </View>

                    {/* Account Settings */}
                    <Text className="px-8 pb-3 pt-8 text-slate-400 text-[11px] font-bold uppercase tracking-[1.5px]">
                        {t("profile.accountSection")}
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <SettingsRow
                            title={t("profile.notifications")}
                            iconType="ion"
                            icon="notifications"
                            iconBg="#FFFBEB"
                            iconColor="#F59E0B"
                            onPress={() => router.push("/(profile)/notifications")}
                        />
                        <SettingsRow
                            title={t("profile.planLimits")}
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
                        {t("profile.securityPrivacy")}
                    </Text>

                    <View className="mx-6 bg-white rounded-[24px] overflow-hidden border border-slate-100">
                        <SettingsRow
                            title={t("profile.privacyPolicy")}
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
                                {t("profile.madeForCouples")}
                            </Text>
                        </View>
                    </View>

                    {/* Logout */}
                    <View className="px-6">
                        <PrimaryButton
                            title={t("profile.logout")}
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