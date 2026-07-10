import "./ClientForm.css";

import { ArrowLeft, Save } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useState } from "react";

import { createUser } from "../../services/api/auth";

import { createClient } from "../../services/firebase/clients";

const ClientForm = () => {

const navigate = useNavigate();

const [name, setName] = useState("");

const [email, setEmail] = useState("");

const [phone, setPhone] = useState("");

const [password, setPassword] = useState("");

const [confirmPassword, setConfirmPassword] = useState("");

const [active, setActive] = useState(true);

const [loading, setLoading] = useState(false);

const handlePhoneChange = (
    value: string
) => {

    const numbers = value.replace(/\D/g, "");

    let formatted = numbers;

    if (numbers.length > 2) {

        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;

    }

    if (numbers.length > 7) {

        formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;

    }

    setPhone(formatted);

};

const handleCreateClient = async () => {

    if (password !== confirmPassword) {

        alert("As senhas não coincidem.");

        return;

    }

    try {

        setLoading(true);

        const user = await createUser({

            email,

            password,

        });

        await createClient({

            uid: user.uid,

            name,

            email,

            phone,

            albumsCount: 0,

            active,

            role: "client",

        });

        setName("");

        setEmail("");

        setPhone("");

        setPassword("");

        setConfirmPassword("");

        setActive(true);

    } catch (error) {

        console.error(error);

    } finally {

        setLoading(false);

    }

};

    return (

        <section className="client-form">

            <div className="client-form__top">

                <button
                    className="client-form__back"
                    onClick={() => navigate("/clients")}
                >

                    <ArrowLeft size={18} />

                    <span>Voltar</span>

                </button>

                <div className="client-form__title">

                    <h2>Novo Cliente</h2>

                    <p>
                        Cadastre um novo cliente para compartilhar seus álbuns.
                    </p>

                </div>

            </div>

            <div className="client-form__card">

                <h3>Informações</h3>

                <div className="client-form__grid">

                    <div className="client-form__field">

                        <label>Nome</label>

                        <input
    type="text"
    placeholder="Nome completo"
    value={name}
    onChange={(e) => setName(e.target.value)}
/>

                    </div>

                    <div className="client-form__field">

                        <label>E-mail</label>

                        <input
    type="email"
    placeholder="cliente@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
/>

                    </div>

                    <div className="client-form__field">

                        <label>WhatsApp</label>

                        <input
    type="text"
    placeholder="(00) 00000-0000"
    value={phone}
    maxLength={15}
    onChange={(e) => handlePhoneChange(e.target.value)}
/>

                    </div>

                    <div className="client-form__field">

                        <label>Status</label>

                        <select
    value={active ? "active" : "inactive"}
    onChange={(e) => setActive(e.target.value === "active")}
>

    <option value="active">

        Ativo

    </option>

    <option value="inactive">

        Inativo

    </option>

</select>

                    </div>

                </div>

            </div>

            <div className="client-form__card">

                <h3>Acesso</h3>

                <div className="client-form__grid">

                    <div className="client-form__field">

                        <label>Senha</label>

                        <input
    type="password"
    placeholder="********"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
/>

                    </div>

                    <div className="client-form__field">

                        <label>Confirmar Senha</label>

                        <input
    type="password"
    placeholder="********"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
/>

                    </div>

                </div>

            </div>

            <div className="client-form__actions">

                <button
                    className="client-form__cancel"
                    onClick={() => navigate("/clients")}
                >

                    Cancelar

                </button>

                <button
    className="client-form__save"
    onClick={handleCreateClient}
    disabled={loading}
>

    <Save size={18} />

    <span>

        {loading ? "Criando..." : "Criar Cliente"}

    </span>

</button>

            </div>

        </section>

    );

};

export default ClientForm;