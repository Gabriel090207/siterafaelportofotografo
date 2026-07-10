import "./Header.css";

import {
    LogOut,
    Menu,
} from "lucide-react";

import { Link } from "react-router-dom";

import logo from "../../../../assets/images/logo/logo.png";

import { useAuth } from "../../../../contexts/AuthContext";

interface HeaderProps {
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
}

const Header = ({
    onToggleSidebar,
}: HeaderProps) => {

    const { user, adminData, logout } = useAuth();

    const name =
        adminData?.name ||
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Administrador";

    const initial = name.charAt(0).toUpperCase();

    return (

        <header className="header">

            <div className="header__left">

                <button
                    className="header__menu"
                    onClick={onToggleSidebar}
                >

                    <Menu size={24} />

                </button>

                <Link
                    to="/dashboard"
                    className="header__logo-link"
                >

                    <img
                        src={logo}
                        alt="Logo"
                        className="header__logo"
                    />

                </Link>

            </div>

            <div className="header__center">

                <div className="header__title">

                    <span></span>

                    <p>PAINEL ADMINISTRATIVO</p>

                    <span></span>

                </div>

            </div>

            <div className="header__right">

                <div className="header__avatar">

                    {initial}

                </div>

                <span className="header__name">

                    {name}

                </span>

                <button
                    onClick={logout}
                    className="header__logout"
                >

                    <LogOut size={16} />

                </button>

            </div>

        </header>

    );

};

export default Header;