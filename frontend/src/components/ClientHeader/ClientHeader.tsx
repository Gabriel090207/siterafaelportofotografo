import "./ClientHeader.css";

import { Link, useLocation } from "react-router-dom";

import {
    Images,
    MessageSquare,
    Heart,
    Download,
    LogOut,
    UserRound,
} from "lucide-react";

import { logoutClient } from "../../firebase/auth";

const ClientHeader = () => {

    const location = useLocation();

    const client = JSON.parse(

        localStorage.getItem("client") ?? "{}"

    );

    const handleLogout = async () => {

        await logoutClient();

        localStorage.removeItem("client");

        window.location.href = "/cliente";

    };

    return (

        <header className="client-header">

            <div className="client-header__container">

                <Link
                    to="/cliente/dashboard"
                    className="client-header__brand"
                >

                    <div className="client-header__logo">

                        <UserRound size={26} />

                    </div>

                    <div>

                        <span>

                            ÁREA DO CLIENTE

                        </span>

                        <h2>

                            Rafael Porto

                        </h2>

                    </div>

                </Link>

                <nav className="client-header__nav">

                    <Link
                        to="/cliente/dashboard"
                        className={
                            location.pathname ===
                            "/cliente/dashboard"

                                ? "active"

                                : ""
                        }
                    >

                        <Images size={18} />

                        <span>

                            Álbuns

                        </span>

                    </Link>

                    <Link to="#">

                        <MessageSquare size={18} />

                        <span>

                            Depoimentos

                        </span>

                    </Link>

                    <Link to="#">

                        <Heart size={18} />

                        <span>

                            Favoritos

                        </span>

                    </Link>

                    <Link to="#">

                        <Download size={18} />

                        <span>

                            Downloads

                        </span>

                    </Link>

                </nav>

                <div className="client-header__right">

                    <div className="client-header__user">

                        <span>

                            Olá,

                        </span>

                        <strong>

                            {client.name}

                        </strong>

                    </div>

                    <button
                        onClick={handleLogout}
                    >

                        <LogOut size={18} />

                    </button>

                </div>

            </div>

        </header>

    );

};

export default ClientHeader;