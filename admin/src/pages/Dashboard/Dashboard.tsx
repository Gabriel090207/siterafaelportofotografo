import "./Dashboard.css";

import {
    CalendarDays,
    Users,
    Images,
    ImageIcon,
    HardDrive,
    ArrowRight,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

import { getDashboardData } from "../../services/api/dashboard";

import type { DashboardData } from "../../types/dashboard";

const Dashboard = () => {

const { user, adminData } = useAuth();

const [dashboard, setDashboard] = useState<DashboardData | null>(null);

   const name =
    adminData?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Administrador";


    useEffect(() => {

    const loadDashboard = async () => {

        const data = await getDashboardData();

        setDashboard(data);

    };

    loadDashboard();

}, []);

    const currentDate = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    });

    return (

        <section className="dashboard">

            <div className="dashboard__header">

                <div>

                    <h2>
                        Bem-vindo, {name}.
                    </h2>

                    <p>
                        Gerencie seus clientes, álbuns e fotografias.
                    </p>

                </div>

                <div className="dashboard__date">

                    <CalendarDays size={18} />

                    <span>{currentDate}</span>

                </div>

            </div>

           <section className="dashboard__stats">

    <div className="dashboard__card">

        <div className="dashboard__card-header">

            <div className="dashboard__card-icon">
                <Users size={20} />
            </div>

            <span>Clientes</span>

        </div>

        <h3>{dashboard?.stats.clients ?? 0}</h3>

    </div>

    <div className="dashboard__card">

        <div className="dashboard__card-header">

            <div className="dashboard__card-icon">
                <Images size={20} />
            </div>

            <span>Álbuns</span>

        </div>

        <h3>{dashboard?.stats.clients ?? 0}</h3>

    </div>

    <div className="dashboard__card">

        <div className="dashboard__card-header">

            <div className="dashboard__card-icon">
                <ImageIcon size={20} />
            </div>

            <span>Fotos</span>

        </div>

        <h3>{dashboard?.stats.photos ?? 0}</h3>

    </div>

    <div className="dashboard__card">

        <div className="dashboard__card-header">

            <div className="dashboard__card-icon">
                <HardDrive size={20} />
            </div>

            <span>Armazenamento</span>

        </div>

       <h3>

    {dashboard?.stats.storage
        ? `${dashboard.stats.storage} GB`
        : "0 GB"}

</h3>

    </div>

</section>

            <section className="dashboard__grid">

                <div className="dashboard__panel">

                    <div className="dashboard__panel-header">

                        <h3>Últimos Clientes</h3>

                        <button>

                            Ver todos

                            <ArrowRight size={16} />

                        </button>

                    </div>

                    <ul>

    {dashboard?.clients.length ? (

        dashboard.clients.map((client) => (

            <li key={client.id}>

                {client.name}

            </li>

        ))

    ) : (

        <li>Nenhum cliente encontrado.</li>

    )}

</ul>

                </div>

                <div className="dashboard__panel">

                    <div className="dashboard__panel-header">

                        <h3>Últimos Álbuns</h3>

                        <button>

                            Ver todos

                            <ArrowRight size={16} />

                        </button>

                    </div>

                   <ul>

    {dashboard?.albums.length ? (

        dashboard.albums.map((album) => (

            <li key={album.id}>

                {album.name}

            </li>

        ))

    ) : (

        <li>Nenhum álbum encontrado.</li>

    )}

</ul>

                </div>

            </section>

            <section className="dashboard__activity">

                <h3>Atividade Recente</h3>

                <ul>

    <li>Nenhuma atividade recente.</li>

</ul>

            </section>

        </section>

    );

};

export default Dashboard;