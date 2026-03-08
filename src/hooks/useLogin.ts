// src/hooks/useLogin.ts
import { loginUser } from '@/src/services/authService';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useLogin() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !pass.trim()) {
            Alert.alert("Missing Fields", "Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            await loginUser({
                email: email.trim(),
                password: pass,
            });

            router.replace("/(tabs)/home");
        } catch (error: any) {
            Alert.alert("Login Error", error.message || "Something went wrong.");
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