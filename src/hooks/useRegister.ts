// src/hooks/useRegister.ts
import { useAuth } from '@/src/context/AuthContext';
import { registerUser } from '@/src/services/authService';
import { getProfileWithPartner } from '@/src/services/pairService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

/**
 * Kullanıcı kayıt işlemlerini yöneten özel hook.
 * Form verilerini, doğrulama mantığını ve kayıt sürecini kontrol eder.
 */
export function useRegister() {
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
            Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun.");
            return;
        }

        // Koşulların kabul edilip edilmediğini kontrol et
        if (!accepted) {
            Alert.alert("Koşullar", "Lütfen Şartlar ve Gizlilik Politikasını kabul edin.");
            return;
        }

        try {
            setLoading(true);

            // Kayıt servisini çağır
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

            // Başarı mesajı göster ve eşleşme ekranına yönlendir
            Alert.alert(
                "Başarılı",
                "Hesabınız başarıyla oluşturuldu.",
                [{ text: "Tamam", onPress: () => router.replace({ pathname: "/(pairing)/pair", params: { from: "register" } }) }]
            );
        } catch (error: any) {
            // Hata durumunda kullanıcıyı bilgilendir
            Alert.alert("Kayıt Hatası", error.message || "Bir şeyler ters gitti.");
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