import { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
    children: ReactNode;
};

export default function Screen({ children }: Props) {
    return (
        <SafeAreaView
            className="bg-bgLight flex-1"
            edges={["top"]}
        >
            {children}
        </SafeAreaView>
    );
}