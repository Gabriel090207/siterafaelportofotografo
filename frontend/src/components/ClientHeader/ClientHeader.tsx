import "./ClientHeader.css";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Download,
    Heart,
    Images,
    LogOut,
    Menu,
    MessageSquare,
    UserRound,
    X,
} from "lucide-react";

import { useToast } from "../../contexts/ToastContext";
import { useClientAuth } from "../../hooks/useClientAuth";

const DRAWER_ANIMATION_MS = 320;

const ClientHeader = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { client, logout } = useClientAuth();
    const { showToast } = useToast();

    const [drawerMounted, setDrawerMounted] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerClosing, setDrawerClosing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const drawerRef = useRef<HTMLElement | null>(null);
    const drawerMountedRef = useRef(false);
    const drawerClosingRef = useRef(false);
    const openingFrameRef = useRef<number | null>(null);
    const closingTimerRef = useRef<number | null>(null);
    const closePromiseRef = useRef<Promise<void> | null>(null);
    const closeResolveRef = useRef<(() => void) | null>(null);
    const manualLogoutInProgressRef = useRef(false);

    const albumsActive =
        location.pathname === "/cliente/dashboard"
        || location.pathname.startsWith("/cliente/albuns/")
        || location.pathname.startsWith("/cliente/album/");
    const testimonialsActive =
        location.pathname === "/cliente/depoimentos";
    const selectionsActive =
        location.pathname.startsWith("/cliente/selecoes");
    const downloadsActive =
        location.pathname === "/cliente/downloads";

    const openDrawer = () => {
        if (drawerMountedRef.current || loggingOut) return;

        drawerMountedRef.current = true;
        drawerClosingRef.current = false;
        setDrawerMounted(true);
        setDrawerClosing(false);
    };

    useEffect(() => {
        if (!drawerMounted || drawerClosingRef.current) return;

        drawerRef.current?.getBoundingClientRect();

        openingFrameRef.current = window.requestAnimationFrame(() => {
            if (
                drawerMountedRef.current
                && !drawerClosingRef.current
            ) {
                setDrawerOpen(true);
            }

            openingFrameRef.current = null;
        });

        return () => {
            if (openingFrameRef.current !== null) {
                window.cancelAnimationFrame(openingFrameRef.current);
                openingFrameRef.current = null;
            }
        };
    }, [drawerMounted]);

    const closeDrawer = useCallback((restoreFocus = true) => {
        if (!drawerMountedRef.current) return Promise.resolve();

        if (closePromiseRef.current) {
            return closePromiseRef.current;
        }

        drawerClosingRef.current = true;
        setDrawerOpen(false);
        setDrawerClosing(true);

        if (openingFrameRef.current !== null) {
            window.cancelAnimationFrame(openingFrameRef.current);
            openingFrameRef.current = null;
        }

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const closePromise = new Promise<void>((resolve) => {
            closeResolveRef.current = resolve;
            closingTimerRef.current = window.setTimeout(() => {
                drawerMountedRef.current = false;
                drawerClosingRef.current = false;
                closingTimerRef.current = null;
                closePromiseRef.current = null;
                closeResolveRef.current = null;
                setDrawerMounted(false);
                setDrawerClosing(false);

                if (restoreFocus) {
                    menuButtonRef.current?.focus();
                }

                resolve();
            }, reducedMotion ? 0 : DRAWER_ANIMATION_MS);
        });

        closePromiseRef.current = closePromise;
        return closePromise;
    }, []);

    useEffect(() => {
        if (!drawerMounted) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [drawerMounted]);

    useEffect(() => {
        if (!drawerOpen || drawerClosing) return;

        const focusTimer = window.setTimeout(() => {
            closeButtonRef.current?.focus();
        }, 0);

        return () => window.clearTimeout(focusTimer);
    }, [drawerClosing, drawerOpen]);

    useEffect(() => {
        if (!drawerMounted || drawerClosing) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                void closeDrawer();
                return;
            }

            if (event.key !== "Tab") return;

            const focusableElements = Array.from(
                drawerRef.current?.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                ) ?? []
            ).filter((element) => !element.hasAttribute("inert"));

            if (focusableElements.length === 0) {
                event.preventDefault();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const focusIsInsideDrawer = drawerRef.current?.contains(
                document.activeElement
            );

            if (!focusIsInsideDrawer) {
                event.preventDefault();
                firstElement.focus();
            } else if (
                event.shiftKey
                && document.activeElement === firstElement
            ) {
                event.preventDefault();
                lastElement.focus();
            } else if (
                !event.shiftKey
                && document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [closeDrawer, drawerClosing, drawerMounted]);

    useEffect(() => {
        if (drawerMountedRef.current) {
            void closeDrawer();
        }
    }, [closeDrawer, location.pathname]);

    useEffect(() => {
        return () => {
            if (openingFrameRef.current !== null) {
                window.cancelAnimationFrame(openingFrameRef.current);
            }

            if (closingTimerRef.current !== null) {
                window.clearTimeout(closingTimerRef.current);
            }

            closeResolveRef.current?.();
            closeResolveRef.current = null;
            closePromiseRef.current = null;
            drawerMountedRef.current = false;
            drawerClosingRef.current = false;
        };
    }, []);

    const handleDrawerNavigation = (
        event: MouseEvent<HTMLAnchorElement>,
        destination: string
    ) => {
        event.preventDefault();

        if (loggingOut) return;

        void closeDrawer().then(() => {
            navigate(destination);
        });
    };

    const handleLogout = async (fromDrawer = false) => {
        if (manualLogoutInProgressRef.current) return;

        manualLogoutInProgressRef.current = true;
        setLoggingOut(true);

        if (fromDrawer) {
            await closeDrawer(false);
        }

        const success = await logout();

        showToast(
            success
                ? "Logout realizado com sucesso!"
                : "Não foi possível encerrar a sessão.",
            success ? "success" : "error"
        );

        if (!success) {
            manualLogoutInProgressRef.current = false;
            setLoggingOut(false);
        }
    };

    const drawerInactive = !drawerOpen || drawerClosing;

    return (
        <header className="client-header">
            <div className="client-header__container">
                <Link
                    to="/cliente/dashboard"
                    className="client-header__brand"
                >
                    <div className="client-header__logo">
                        <UserRound size={26} aria-hidden="true" />
                    </div>

                    <div>
                        <span>ÁREA DO CLIENTE</span>
                        <h2>Rafael Porto</h2>
                    </div>
                </Link>

                <nav
                    className="client-header__nav"
                    aria-label="Navegação da área do cliente"
                >
                    <Link
                        to="/cliente/dashboard"
                        className={albumsActive ? "active" : ""}
                    >
                        <Images size={18} aria-hidden="true" />
                        <span>Álbuns</span>
                    </Link>

                    <Link
                        to="/cliente/depoimentos"
                        className={testimonialsActive ? "active" : ""}
                    >
                        <MessageSquare size={18} aria-hidden="true" />
                        <span>Depoimentos</span>
                    </Link>

                    <Link
                        to="/cliente/selecoes"
                        className={selectionsActive ? "active" : ""}
                    >
                        <Heart size={18} aria-hidden="true" />
                        <span>Seleções</span>
                    </Link>

                    <Link
                        to="/cliente/downloads"
                        className={downloadsActive ? "active" : ""}
                    >
                        <Download size={18} aria-hidden="true" />
                        <span>Downloads</span>
                    </Link>
                </nav>

                <div className="client-header__right">
                    <div className="client-header__user">
                        <span>Olá,</span>
                        <strong>{client?.name}</strong>
                    </div>

                    <button
                        type="button"
                        onClick={() => void handleLogout()}
                        disabled={loggingOut}
                        aria-label="Sair da área do cliente"
                    >
                        <LogOut size={18} aria-hidden="true" />
                    </button>
                </div>

                <button
                    ref={menuButtonRef}
                    type="button"
                    className="client-header__menu-button"
                    onClick={openDrawer}
                    disabled={loggingOut}
                    aria-expanded={drawerOpen && !drawerClosing}
                    aria-controls="client-navigation-drawer"
                    aria-label="Abrir menu da área do cliente"
                >
                    <Menu size={21} aria-hidden="true" />
                </button>
            </div>

            {drawerMounted && createPortal(
                <div
                    className={`client-header-drawer${
                        drawerOpen ? " client-header-drawer--open" : ""
                    }${
                        drawerClosing ? " client-header-drawer--closing" : ""
                    }`}
                >
                    <div
                        className="client-header-drawer__backdrop"
                        onClick={() => void closeDrawer()}
                        aria-hidden="true"
                    />

                    <aside
                        ref={drawerRef}
                        id="client-navigation-drawer"
                        className="client-header-drawer__panel"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu da área do cliente"
                        aria-hidden={drawerInactive}
                        inert={drawerInactive ? true : undefined}
                    >
                        <div className="client-header-drawer__heading">
                            <button
                                ref={closeButtonRef}
                                type="button"
                                className="client-header-drawer__close"
                                onClick={() => void closeDrawer()}
                                aria-label="Fechar menu"
                            >
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <nav
                            className="client-header-drawer__nav"
                            aria-label="Navegação móvel da área do cliente"
                        >
                            <Link
                                to="/cliente/dashboard"
                                className={albumsActive ? "active" : ""}
                                onClick={(event) =>
                                    handleDrawerNavigation(
                                        event,
                                        "/cliente/dashboard"
                                    )
                                }
                            >
                                <Images size={20} aria-hidden="true" />
                                <span>Álbuns</span>
                            </Link>

                            <Link
                                to="/cliente/depoimentos"
                                className={testimonialsActive ? "active" : ""}
                                onClick={(event) =>
                                    handleDrawerNavigation(
                                        event,
                                        "/cliente/depoimentos"
                                    )
                                }
                            >
                                <MessageSquare size={20} aria-hidden="true" />
                                <span>Depoimentos</span>
                            </Link>

                            <Link
                                to="/cliente/selecoes"
                                className={selectionsActive ? "active" : ""}
                                onClick={(event) =>
                                    handleDrawerNavigation(
                                        event,
                                        "/cliente/selecoes"
                                    )
                                }
                            >
                                <Heart size={20} aria-hidden="true" />
                                <span>Seleções</span>
                            </Link>

                            <Link
                                to="/cliente/downloads"
                                className={downloadsActive ? "active" : ""}
                                onClick={(event) =>
                                    handleDrawerNavigation(
                                        event,
                                        "/cliente/downloads"
                                    )
                                }
                            >
                                <Download size={20} aria-hidden="true" />
                                <span>Downloads</span>
                            </Link>
                        </nav>

                        <div className="client-header-drawer__footer">
                            <div className="client-header-drawer__user">
                                <span>Olá,</span>
                                <strong>{client?.name}</strong>
                            </div>

                            <button
                                type="button"
                                className="client-header-drawer__logout"
                                onClick={() => void handleLogout(true)}
                                disabled={loggingOut}
                            >
                                <LogOut size={18} aria-hidden="true" />
                                <span>{loggingOut ? "Saindo..." : "Sair"}</span>
                            </button>
                        </div>
                    </aside>
                </div>,
                document.body
            )}
        </header>
    );
};

export default ClientHeader;
