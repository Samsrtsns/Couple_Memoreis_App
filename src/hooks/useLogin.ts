// src/hooks/useLogin.ts
import { useAuth } from '@/src/context/AuthContext';
import { loginUser } from '@/src/services/authService';
import { getProfileWithPartner } from '@/src/services/pairService';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

/**
 * Kullanıcı giriş işlemlerini yöneten özel hook.
 * Email, şifre state'lerini ve giriş fonksiyonunu sağlar.
 */
export function useLogin() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { dispatch } = useAuth();

    /**
     * Giriş yap butonuna basıldığında çalışan ana fonksiyon.
     */
    const handleLogin = async () => {
        // Alanların doldurulup doldurulmadığını kontrol et
        if (!email.trim() || !pass.trim()) {
            Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi giriniz.");
            return;
        }

        try {
            setLoading(true);

            // Giriş servisini çağır
            const sessionResponse = await loginUser({
                email: email.trim(),
                password: pass,
            });

            // Giriş başarılıysa, hemen profil verilerini çek
            if (sessionResponse?.session) {
                dispatch({ type: 'FETCH_PROFILE_START' });
                try {
                    const { profile, partner } = await getProfileWithPartner();

                    // Tüm bilgileri global yetkilendirme (auth) state'ine gönder
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: {
                            session: sessionResponse.session,
                            user: sessionResponse.user,
                            profile,
                            partner,
                        }
                    });
                } catch (profileError) {
                    console.error("Giriş sırasında profil çekilemedi:", profileError);
                    // Profil çekilemese bile oturumu açılmış olarak işaretle
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: {
                            session: sessionResponse.session,
                            user: sessionResponse.user,
                            profile: null,
                            partner: null,
                        }
                    });
                }
            }

            // Başarılı girişten sonra ana sayfaya yönlendir
            router.replace("/(tabs)/home");
        } catch (error: any) {
            // Hata durumunda kullanıcıyı bilgilendir
            Alert.alert("Giriş Hatası", error.message || "Bir şeyler ters gitti.");
        } finally {
            setLoading(false);
        }
    };

    return {
        email, setEmail,
        pass, setPass,
        showPass, setShowPass,
        loading,
        handleLogin
    };
}