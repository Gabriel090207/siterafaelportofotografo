import "./Clients.css";

import { useEffect, useMemo, useState } from "react";

import {
    Plus,
    Search,
    Pencil,
    Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Client } from "../../types/client";

import { subscribeClients } from "../../services/firebase/clients";

const Clients = () => {

    const navigate = useNavigate();

    const [clients, setClients] = useState<Client[]>([]);

    const [search, setSearch] = useState("");

    useEffect(() => {

        const unsubscribe = subscribeClients(setClients);

        return () => unsubscribe();

    }, []);

    const filteredClients = useMemo(() => {

        const term = search.toLowerCase();

        return clients.filter((client) =>

            client.name.toLowerCase().includes(term) ||

            client.email.toLowerCase().includes(term) ||

            client.phone.includes(search)

        );

    }, [clients, search]);

    return (

        <section className="clients">

            <div className="clients__header">

                <div>

                    <h2>Clientes</h2>

                    <p>

                        Gerencie todos os clientes cadastrados.

                    </p>

                </div>

                <button
                    className="clients__new"
                    onClick={() => navigate("/clients/new")}
                >

                    <Plus size={18} />

                    <span>Novo Cliente</span>

                </button>

            </div>

            <div className="clients__search">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Pesquisar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </div>

            <div className="clients__table">

                <table>

                    <thead>

                        <tr>

                            <th>Nome</th>

                            <th>E-mail</th>

                            <th>WhatsApp</th>

                            <th>Álbuns</th>

                            <th>Ações</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredClients.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={5}
                                    style={{
                                        textAlign: "center",
                                        padding: "40px",
                                    }}
                                >

                                    Nenhum cliente encontrado.

                                </td>

                            </tr>

                        ) : (

                            filteredClients.map((client) => (

                                <tr key={client.id}>

                                    <td>

                                        {client.name}

                                    </td>

                                    <td>

                                        {client.email}

                                    </td>

                                    <td>

                                        {client.phone}

                                    </td>

                                    <td>

                                        {client.albumsCount}

                                    </td>

                                    <td>

                                        <div className="clients__actions">

                                            <button>

                                                <Pencil size={18} />

                                            </button>

                                            <button>

                                                <Trash2 size={18} />

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

            <div className="clients__cards">

    {filteredClients.length === 0 ? (

        <div className="clients__card">

            <p>Nenhum cliente encontrado.</p>

        </div>

    ) : (

        filteredClients.map((client) => (

            <div
                key={client.id}
                className="clients__card"
            >

                <h3>{client.name}</h3>

                <p>{client.email}</p>

                <p>{client.phone}</p>

                <span>

                    Álbuns: {client.albumsCount}

                </span>

                <div className="clients__actions">

                    <button>

                        <Pencil size={18} />

                    </button>

                    <button>

                        <Trash2 size={18} />

                    </button>

                </div>

            </div>

        ))

    )}

</div>
 
        </section>

    );

};

export default Clients;