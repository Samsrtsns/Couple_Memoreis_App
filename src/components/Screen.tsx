import { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
    children: ReactNode;
};

export default function Screen({ children }: Props) {
    return (
        <SafeAreaView
            className="flex-1 bg-bgLight"
            edges={["top"]}
        >
            {children}
        </SafeAreaView>
    );
}