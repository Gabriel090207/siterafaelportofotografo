import "./Sidebar.css";

import {
    Images,
    LayoutDashboard,
    Settings,
    Users,
} from "lucide-react";

import { NavLink } from "react-router-dom";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({
    isOpen,
    onClose,
}: SidebarProps) => {

    return (

        <aside
            className={
                isOpen
                    ? "sidebar sidebar--open"
                    : "sidebar"
            }
        >

            <nav className="sidebar__menu">

                <NavLink
                    to="/dashboard"
                    onClick={onClose}
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar__item sidebar__item--active"
                            : "sidebar__item"
                    }
                >

                    <LayoutDashboard size={20} />

                    <span>Dashboard</span>

                </NavLink>

                <NavLink
                    to="/clients"
                    onClick={onClose}
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar__item sidebar__item--active"
                            : "sidebar__item"
                    }
                >

                    <Users size={20} />

                    <span>Clientes</span>

                </NavLink>

                <NavLink
                    to="/albums"
                    onClick={onClose}
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar__item sidebar__item--active"
                            : "sidebar__item"
                    }
                >

                    <Images size={20} />

                    <span>Álbuns</span>

                </NavLink>


                <NavLink
    to="/feed"
    onClick={onClose}
    className={({ isActive }) =>
        isActive
            ? "sidebar__item sidebar__item--active"
            : "sidebar__item"
    }
>

    <Images size={20} />

    <span>Feed</span>

</NavLink>

                <NavLink
                    to="/settings"
                    onClick={onClose}
                    className={({ isActive }) =>
                        isActive
                            ? "sidebar__item sidebar__item--active"
                            : "sidebar__item"
                    }
                >

                    <Settings size={20} />

                    <span>Configurações</span>

                </NavLink>

            </nav>

        </aside>

    );

};

export default Sidebar;