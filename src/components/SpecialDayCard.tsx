import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { calculateDaysRemaining, parseDateOnlyString } from "../utils/dateUtils";

const DATE_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
    gift: { bg: "#FEE2E2", text: "#DC2626" },
    heart: { bg: "#FFE4E6", text: "#E11D48" },
    sparkles: { bg: "#FEF3C7", text: "#D97706" },
    calendar: { bg: "#DBEAFE", text: "#2563EB" },
};

type Props = {
    title: string;
    date: string;
    isYearly?: boolean;
    iconName?: string;
};

export default function SpecialDayCard({
    title,
    date,
    isYearly = true,
    iconName = "heart",
}: Props) {
    const { t } = useTranslation();
    const remainingDays = calculateDaysRemaining(date, isYearly);

    const parsedDate = parseDateOnlyString(date) ?? new Date(2000, 0, 1);
    const day = parsedDate.getDate();
    const monthIndex = parsedDate.getMonth();
    const monthAbbr = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
    ][monthIndex] ?? "JAN";

    const colors = DATE_BADGE_COLORS[iconName ?? "heart"] || {
        bg: "#FFE4E6",
        text: "#E11D48",
    };

    return (
        <View
            className="w-full rounded-2xl bg-bgLight px-4 py-4"
            style={{
                shadowColor: "#FF8A8A",
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
            }}
        >
            <View className="flex-row items-center">
                {/* Date Badge */}
                <View
                    className="h-14 w-14 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: colors.bg }}
                >
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 10,
                            fontWeight: "700",
                            letterSpacing: 0.5,
                        }}
                    >
                        {monthAbbr}
                    </Text>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: 20,
                            fontWeight: "800",
                            marginTop: -1,
                        }}
                    >
                        {String(day).padStart(2, "0")}
                    </Text>
                </View>

                <View className="flex-1">
                    <Text
                        numberOfLines={1}
                        className="text-slate-700 font-bold text-[15px]"
                    >
                        {title}
                    </Text>

                    <Text className="text-rose-500 font-semibold text-[13px] mt-1">
                        {remainingDays === 0
                            ? t("specialDay.today")
                            : t("specialDay.daysLeft", { days: remainingDays })}
                    </Text>
                </View>
            </View>
        </View>
    );
}