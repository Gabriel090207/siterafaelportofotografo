import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Login.css";

import { Lock, Mail } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
    useToast,
} from "../../contexts/ToastContext";

import {
    getErrorMessage,
} from "../../utils/errorMessage";

import logo from "../../assets/images/logo/logo.png";
import loginBg from "../../assets/images/login/login.png";

const Login = () => {

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const { login } = useAuth();

const { showToast } = useToast();

const navigate = useNavigate();

const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
) => {

    event.preventDefault();

   try {

    await login(email, password);


    showToast(
        "Login realizado com sucesso!",
        "success"
    );


    navigate("/dashboard");


} catch (error) {

    console.error(error);

    showToast(
        getErrorMessage(error),
        "error"
    );

}

};

    return (
        <main
            className="login"
            style={{
                backgroundImage: `url(${loginBg})`,
            }}
        >
            <div className="login__overlay"></div>

            <section className="login__container">

                <img
                    src={logo}
                    alt="Logo"
                    className="login__logo"
                />

                <div className="login__header">

                    <span className="login__subtitle">
                        PAINEL ADMINISTRATIVO
                    </span>

                    <h1 className="login__title">
                        Bem-vindo
                    </h1>

                    <p className="login__description">
                        Faça login para gerenciar clientes, álbuns e fotografias.
                    </p>

                </div>

                <form
    className="login__form"
    onSubmit={handleLogin}
>

                    <div className="login__field">

                        <label>E-mail</label>

                        <div className="login__input">

                            <Mail size={20} />

                            <input
    type="email"
    placeholder="Digite seu e-mail"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
/>

                        </div>

                    </div>

                    <div className="login__field">

                        <label>Senha</label>

                        <div className="login__input">

                            <Lock size={20} />

                            <input
    type="password"
    placeholder="Digite sua senha"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
/>

                        </div>

                    </div>

                    <button
                        type="submit"
                        className="login__button"
                    >
                        Entrar
                    </button>

                </form>

            </section>

        </main>
    );
};

export default Login;