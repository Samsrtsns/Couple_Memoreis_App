// src/hooks/useRegister.ts
import { useAuth } from '@/src/context/AuthContext';
import { registerUser } from '@/src/services/authService';
import { getProfileWithPartner } from '@/src/services/pairService';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

export function useRegister() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [accepted, setAccepted] = useState(false);
    const [password, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const { dispatch } = useAuth();

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !password) {
            Alert.alert("Missing Fields", "Please fill all fields.");
            return;
        }

        if (!accepted) {
            Alert.alert("Terms", "Please agree to the Terms & Privacy.");
            return;
        }

        try {
            setLoading(true);

            const data = await registerUser({
                firstName,
                lastName,
                email: email.trim(),
                password,
            });

            // Initialize the global auth state for the newly registered user
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
                    // Even if profile fetch fails, still mark them as logged in
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

            Alert.alert(
                "Success",
                "Account created successfully.",
                [{ text: "OK", onPress: () => router.replace({ pathname: "/(pairing)/pair", params: { from: "register" } }) }]
            );
        } catch (error: any) {
            Alert.alert("Register Error", error.message || "Something went wrong.");
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