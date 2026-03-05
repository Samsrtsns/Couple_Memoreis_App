import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type InputAreaProps = {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "email-address" | "numeric";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    secureTextEntry?: boolean;

    right?: React.ReactNode;
    onRightPress?: () => void;
};

export function TextInputArea({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    autoCapitalize = "none",
    secureTextEntry = false,
    right,
    onRightPress,
}: InputAreaProps) {
    const [focused, setFocused] = useState(false);

    const borderClass = useMemo(
        () => (focused ? "border-primary" : "border-slate200"),
        [focused]
    );

    return (
        <View className="gap-y-2">
            <Text className="text-sm font-semibold ml-1 text-slate700">{label}</Text>

            <View className="relative justify-center">
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize={autoCapitalize}
                    keyboardType={keyboardType}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    textAlignVertical="center"
                    style={{ paddingVertical: 0 }}
                    className={[
                        "w-full h-14 bg-white border rounded-xl px-4 pr-12 text-slate900",
                        borderClass,
                    ].join(" ")}
                />

                {right ? (
                    <Pressable onPress={onRightPress} className="absolute right-4">
                        {right}
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}
