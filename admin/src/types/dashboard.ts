export interface DashboardStats {
    clients: number;
    albums: number;
    photos: number;
    storage: number;
}

export interface DashboardClient {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
}

export interface DashboardAlbum {
    id: string;
    name: string;
    createdAt: Date;
}

export interface DashboardData {
    stats: DashboardStats;
    clients: DashboardClient[];
    albums: DashboardAlbum[];
}