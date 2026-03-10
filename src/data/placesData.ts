export type PlaceComment = {
    userId: string;
    userName: string;
    avatar: string;
    text: string;
};

export type SharedPlace = {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    image: string;
    visitedAt: string;
    createdBy: string;
    isFavorite: boolean;
    comments: PlaceComment[];
};

export const MOCK_PLACES: SharedPlace[] = [
    {
        id: "1",
        title: "First Coffee Date ☕",
        latitude: 41.0352,
        longitude: 28.9774,
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
        visitedAt: "2024-02-14",
        createdBy: "user_a",
        isFavorite: true,
        comments: [
            {
                userId: "user_a",
                userName: "You",
                avatar: "https://i.pravatar.cc/100?img=1",
                text: "I was so nervous but you made me feel at ease instantly 🥰",
            },
            {
                userId: "user_b",
                userName: "Selin",
                avatar: "https://i.pravatar.cc/100?img=5",
                text: "Best latte I've ever had, mostly because of the company 💕",
            },
        ],
    },
    {
        id: "2",
        title: "Sunset at the Pier 🌅",
        latitude: 40.9954,
        longitude: 28.9657,
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
        visitedAt: "2024-03-21",
        createdBy: "user_b",
        isFavorite: true,
        comments: [
            {
                userId: "user_a",
                userName: "You",
                avatar: "https://i.pravatar.cc/100?img=1",
                text: "That sunset was pure magic. Never want to forget this moment.",
            },
            {
                userId: "user_b",
                userName: "Selin",
                avatar: "https://i.pravatar.cc/100?img=5",
                text: "We stayed until the stars came out 🌟 Perfect night.",
            },
        ],
    },
    {
        id: "3",
        title: "Rainy Day Bookshop 📚",
        latitude: 41.0102,
        longitude: 28.9661,
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
        visitedAt: "2024-04-05",
        createdBy: "user_a",
        isFavorite: false,
        comments: [
            {
                userId: "user_a",
                userName: "You",
                avatar: "https://i.pravatar.cc/100?img=1",
                text: "Found that poetry book you still quote all the time 😄",
            },
            {
                userId: "user_b",
                userName: "Selin",
                avatar: "https://i.pravatar.cc/100?img=5",
                text: "Rainy days + old books = perfect. Come back here someday 🌧️",
            },
        ],
    },
    {
        id: "4",
        title: "Anniversary Dinner 🍽️",
        latitude: 41.0218,
        longitude: 29.0081,
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
        visitedAt: "2025-01-15",
        createdBy: "user_b",
        isFavorite: true,
        comments: [
            {
                userId: "user_a",
                userName: "You",
                avatar: "https://i.pravatar.cc/100?img=1",
                text: "You planned the whole evening as a surprise. I cried a little 🥲",
            },
            {
                userId: "user_b",
                userName: "Selin",
                avatar: "https://i.pravatar.cc/100?img=5",
                text: "Worth every bit of planning. You deserved a perfect night 💗",
            },
        ],
    },
];
