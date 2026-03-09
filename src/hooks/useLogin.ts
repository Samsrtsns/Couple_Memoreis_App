// src/hooks/useLogin.ts
import { useAuth } from '@/src/context/AuthContext';
import { loginUser } from '@/src/services/authService';
import { getProfileWithPartner } from '@/src/services/pairService';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useLogin() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { dispatch } = useAuth();

    const handleLogin = async () => {
        if (!email.trim() || !pass.trim()) {
            Alert.alert("Missing Fields", "Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            const sessionResponse = await loginUser({
                email: email.trim(),
                password: pass,
            });

            // If login succeeds, immediately fetch profile data
            if (sessionResponse?.session) {
                dispatch({ type: 'FETCH_PROFILE_START' });
                try {
                    const { profile, partner } = await getProfileWithPartner();

                    // Dispatch all info to global auth state
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
                    console.error("Failed to fetch profile on login:", profileError);
                    // Still dispatch login even if profile fails
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