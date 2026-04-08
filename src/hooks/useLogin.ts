// src/hooks/useLogin.ts
import { loginUser } from '@/src/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert } from 'react-native';

/**
 * Kullanıcı giriş işlemlerini yöneten özel hook.
 *
 * loginUser() çağrısı başarılı olunca Supabase SIGNED_IN event'i tetikler.
 * AuthContext.onAuthStateChange bu event'i dinler, profil çeker ve
 * LOGIN_SUCCESS dispatch eder; _layout.tsx'deki navigation effect de
 * isLoggedIn=true olunca ana ekrana yönlendirir.
 * Bu nedenle burada dispatch veya router.replace çağırmıyoruz.
 */
export function useLogin() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !pass.trim()) {
            Alert.alert("Eksik Bilgi", "Lütfen e-posta ve şifrenizi giriniz.");
            return;
        }

        try {
            setLoading(true);

            await loginUser({
                email: email.trim(),
                password: pass,
            });

            await AsyncStorage.setItem('hasLaunched', 'true');
        } catch (error: any) {
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