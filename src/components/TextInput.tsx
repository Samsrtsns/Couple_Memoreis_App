import React, { useMemo, useState } from "react";
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
    editable?: boolean;
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
    editable = true,
}: InputAreaProps) {
    const [focused, setFocused] = useState(false);

    const borderClass = useMemo(
        () => (focused ? "border-primary" : "border-slate200"),
        [focused]
    );

    const hasRight = !!right;

    return (
        <View className="gap-y-2 w-full">
            <Text className="text-sm font-semibold ml-1 text-slate700">{label}</Text>

            <View className="relative w-full flex-row items-center">
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
                    editable={editable}
                    textAlign="left"
                    style={{
                        paddingLeft: 16,
                        paddingRight: hasRight ? 48 : 16,
                        flex: 1,
                    }}
                    className={[
                        "h-14 bg-white border rounded-xl text-slate900",
                        borderClass,
                    ].join(" ")}
                />

                {hasRight && (
                    <Pressable
                        onPress={onRightPress}
                        hitSlop={20}
                        style={{
                            position: 'absolute',
                            right: 0,
                            height: '100%',
                            width: 48,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {right}
                    </Pressable>
                )}
            </View>
        </View>
    );
}