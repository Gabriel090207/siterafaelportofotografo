import "./ClientLogin.css";

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    UserRound,
} from "lucide-react";

import { useToast } from "../../contexts/ToastContext";
import {
    loginClient,
    logoutClient,
} from "../../services/firebase/auth";
import { getClientByUid } from "../../services/firebase/clients";

function getAuthErrorMessage(error: unknown) {
    const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
            ? error.code
            : "";

    switch (code) {
        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "E-mail ou senha incorretos.";
        case "auth/too-many-requests":
            return "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.";
        case "auth/network-request-failed":
            return "Não foi possível conectar. Verifique sua internet e tente novamente.";
        default:
            return "Não foi possível entrar. Tente novamente.";
    }
}

function ClientLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const loginInProgress = useRef(false);

    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();

        if (loginInProgress.current) return;

        const normalizedEmail = email.trim();

        if (!normalizedEmail || !password.trim()) {
            showToast("Preencha o e-mail e a senha.", "warning");
            return;
        }

        loginInProgress.current = true;
        setLoading(true);

        try {
            const user = await loginClient(normalizedEmail, password);
            const client = await getClientByUid(user.uid);

            if (!client) {
                await logoutClient();
                showToast(
                    "Não foi possível localizar seu cadastro de cliente.",
                    "error"
                );
                return;
            }

            if ("active" in client && client.active === false) {
                await logoutClient();
                showToast(
                    "Seu acesso está inativo. Entre em contato para obter ajuda.",
                    "error"
                );
                return;
            }

            showToast("Login realizado com sucesso!", "success");
            navigate("/cliente/dashboard");
        } catch (error) {
            console.error(error);
            showToast(getAuthErrorMessage(error), "error");
        } finally {
            loginInProgress.current = false;
            setLoading(false);
        }
    };

    return (
        <main className="client-login">
            <div className="client-login__card">
                <div className="client-login__avatar" aria-hidden="true">
                    <UserRound size={42} />
                </div>

                <span className="client-login__eyebrow">
                    ÁREA DO CLIENTE
                </span>

                <h1>Acesse sua conta</h1>

                <p>
                    Entre com seu e-mail e senha para visualizar seus álbuns,
                    selecionar favoritas e realizar downloads.
                </p>

                <form
                    className="client-login__form"
                    onSubmit={handleLogin}
                    aria-busy={loading}
                >
                    <div className="client-login__field">
                        <label htmlFor="client-login-email">E-mail</label>

                        <div
                            className={`client-login__input${
                                loading ? " client-login__input--disabled" : ""
                            }`}
                        >
                            <Mail size={18} aria-hidden="true" />

                            <input
                                id="client-login-email"
                                type="email"
                                placeholder="Digite seu e-mail"
                                autoComplete="email"
                                value={email}
                                disabled={loading}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="client-login__field">
                        <label htmlFor="client-login-password">Senha</label>

                        <div
                            className={`client-login__input${
                                loading ? " client-login__input--disabled" : ""
                            }`}
                        >
                            <Lock size={18} aria-hidden="true" />

                            <input
                                id="client-login-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Digite sua senha"
                                autoComplete="current-password"
                                value={password}
                                disabled={loading}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />

                            <button
                                type="button"
                                className="client-login__eye"
                                disabled={loading}
                                onClick={() =>
                                    setShowPassword((current) => !current)
                                }
                                aria-label={
                                    showPassword
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                                aria-pressed={showPassword}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} aria-hidden="true" />
                                ) : (
                                    <Eye size={18} aria-hidden="true" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="client-login__submit"
                        disabled={loading}
                    >
                        {loading && (
                            <span
                                className="client-login__spinner"
                                aria-hidden="true"
                            />
                        )}

                        <span>{loading ? "Entrando..." : "Entrar"}</span>
                    </button>
                </form>
            </div>
        </main>
    );
}

export default ClientLogin;
