export interface FeedCategoryItem {
    id: string;
    name: string;
    cover: string;
}

export const feedCategories: FeedCategoryItem[] = [
    {
        id: "casamentos",
        name: "Casamentos",
        cover:
            "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200",
    },
    {
        id: "15-anos",
        name: "15 Anos",
        cover:
            "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200",
    },
    {
        id: "pre-wedding",
        name: "Pré Wedding",
        cover:
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200",
    },
    {
        id: "infantil",
        name: "Infantil",
        cover:
            "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200",
    },
    {
        id: "gestante",
        name: "Book de Gestante",
        cover:
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200",
    },
    {
        id: "ensaio",
        name: "Ensaio Fotográfico",
        cover:
            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200",
    },
    {
        id: "corporativos",
        name: "Corporativos",
        cover:
            "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",
    },
    {
        id: "formaturas",
        name: "Formaturas",
        cover:
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200",
    },
    {
        id: "aniversarios",
        name: "Aniversários",
        cover:
            "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1200",
    },
];

export const feedCategoryNames: Record<string, string> =
    Object.fromEntries(
        feedCategories.map((category) => [
            category.id,
            category.name,
        ])
    );