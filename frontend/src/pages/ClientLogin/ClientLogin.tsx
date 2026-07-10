import "./ClientLogin.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginClient } from "../../firebase/auth";
import { getClientByUid } from "../../firebase/clients";

import {
    UserRound,
    Mail,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";

function ClientLogin() {

const [showPassword, setShowPassword] = useState(false);

const navigate = useNavigate();

const [email, setEmail] = useState("");

const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);


const handleLogin = async (
    event: React.FormEvent
) => {

    event.preventDefault();

    try {

        setLoading(true);

        const user = await loginClient(
            email,
            password
        );

        const client =
            await getClientByUid(user.uid);

        if (!client) {

            alert(
                "Cliente não encontrado."
            );

            return;

        }

        localStorage.setItem(
            "client",
            JSON.stringify(client)
        );

        navigate("/cliente/dashboard");

    } catch (error) {

        console.error(error);

        alert(
            "E-mail ou senha inválidos."
        );

    } finally {

        setLoading(false);

    }

};

    return (

        <main className="client-login">

            <div className="client-login__card">

                <div className="client-login__avatar">

                    <UserRound size={42} />

                </div>

                <span className="client-login__eyebrow">

                    ÁREA DO CLIENTE

                </span>

                <h1>

                    Acesse sua conta

                </h1>

                <p>

                    Entre com seu email e senha para visualizar seus
                    álbuns, selecionar favoritas e realizar downloads.

                </p>

               <form
    className="client-login__form"
    autoComplete="off"
    onSubmit={handleLogin}
>

                    <div className="client-login__field">

                        <label>

    E-mail

</label>

<div className="client-login__input">

    <Mail size={18} />

    <input
    type="email"
    placeholder="Digite seu e-mail"
    value={email}
    onChange={(event) =>
        setEmail(event.target.value)
    }
/>

</div>

                    </div>

                    <div className="client-login__field">

                        <label>

                            Senha

                        </label>

                        <div className="client-login__input">

                            <Lock size={18} />

                           <input
    type={
        showPassword
            ? "text"
            : "password"
    }
    placeholder="Digite sua senha"
    value={password}
    onChange={(event) =>
        setPassword(event.target.value)
    }
/>

                            <button
                                type="button"
                                className="client-login__eye"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >

                                {showPassword ? (

                                    <EyeOff size={18} />

                                ) : (

                                    <Eye size={18} />

                                )}

                            </button>

                        </div>

                    </div>

             
                   

                    <button
                        type="submit"
                        className="client-login__submit"
                    >

                       {loading
    ? "Entrando..."
    : "Entrar"}

                    </button>

                </form>

                <button
                    type="button"
                    className="client-login__support"
                >

                    Esqueci minha senha
                </button>

            </div>

        </main>

    );

}

export default ClientLogin;