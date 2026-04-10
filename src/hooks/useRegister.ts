// src/hooks/useRegister.ts
import { useAuth } from '@/src/context/AuthContext';
import { registerUser } from '@/src/services/authService';
import { getProfileWithPartner } from '@/src/services/pairService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Kullanıcı kayıt işlemlerini yöneten özel hook.
 * Form verilerini, doğrulama mantığını ve kayıt sürecini kontrol eder.
 */
export function useRegister() {
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [password, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { dispatch } = useAuth();

    /**
     * Kayıt Ol butonuna basıldığında çalışan ana fonksiyon.
     */
    const handleRegister = async () => {
        // Form alanlarının doluluğunu kontrol et
        if (!firstName || !lastName || !email || !password) {
            Alert.alert(t("auth.missingInfoTitle"), t("auth.registerMissingInfo"));
            return;
        }

        // Koşulların kabul edilip edilmediğini kontrol et
        if (!accepted) {
            Alert.alert(t("auth.termsTitle"), t("auth.termsRequired"));
            return;
        }

        try {
            setLoading(true);

            // signUp SIGNED_IN tetikleyicisinden ÖNCE yazılmalı; yoksa _layout önce home'a yönlendirir.
            await AsyncStorage.setItem('redirectToPairAfterRegister', 'true');

            const data = await registerUser({
                firstName,
                lastName,
                email: email.trim(),
                password,
            });

            // Kayıt başarılıysa, yeni kullanıcı için global state'i hazırla
            if (data?.session && data?.user) {
                dispatch({ type: 'FETCH_PROFILE_START' });
                try {
                    const { profile, partner } = await getProfileWithPartner();
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: {
                            session: data.session,
                            user: data.user,
                            profile,
                            partner,
                        }
                    });
                } catch (profileError) {
                    // Profil çekilemese bile kullanıcıyı oturum açmış olarak işaretle
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: {
                            session: data.session,
                            user: data.user,
                            profile: null,
                            partner: null,
                        }
                    });
                }
            }

            if (data?.session) {
                await AsyncStorage.setItem('hasLaunched', 'true');
            }

            // Yönlendirme NavigationRoot (redirectToPairAfterRegister) ile yapılır; çift replace olmasın.
            Alert.alert(t("common.success"), t("auth.registerSuccess"));
        } catch (error: any) {
            await AsyncStorage.removeItem('redirectToPairAfterRegister').catch(() => {});
            Alert.alert(t("auth.registerErrorTitle"), error.message || t("auth.genericError"));
        } finally {
            setLoading(false);
        }
    };

    return {
        firstName, setFirstName,
        lastName, setLastName,
        email, setEmail,
        accepted, setAccepted,
        password, setPass,
        showPass, setShowPass,
        loading,
        handleRegister
    };
}