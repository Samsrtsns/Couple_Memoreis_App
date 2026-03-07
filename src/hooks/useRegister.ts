import { registerUser } from '@/src/services/authService';
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

            await registerUser({
                firstName,
                lastName,
                email,
                password,
            });

            Alert.alert(
                "Success",
                "Account created successfully.",
                [
                    { text: "OK", onPress: () => router.replace("/login") }
                ]
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
