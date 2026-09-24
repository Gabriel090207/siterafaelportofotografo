import "./Clients.css";

import { useEffect, useMemo, useRef, useState } from "react";

import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Link as LinkIcon,
    Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Client } from "../../types/client";

import { subscribeClients } from "../../services/firebase/clients";
import { matchesClientEmail } from "../../utils/clientEmails";
import {
    deleteClient,
    getClientShareLink,
} from "../../services/api/clients";
import { useToast } from "../../contexts/ToastContext";

import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";

const Clients = () => {

    const navigate = useNavigate();
    const { showToast } = useToast();
    const copyingRef = useRef(new Set<string>());
    const [copying, setCopying] = useState(new Set<string>());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    const copyLink = async (clientId: string) => {
        if (copyingRef.current.has(clientId)) return;
        copyingRef.current.add(clientId);
        setCopying(new Set(copyingRef.current));
        try {
            let shareLink: string;
            try {
                shareLink = await getClientShareLink(clientId);
            } catch (error) {
                showToast(error instanceof Error ? error.message : "Não foi possível obter o link de acesso.", "error");
                return;
            }
            try {
                await navigator.clipboard.writeText(shareLink);
            } catch {
                showToast("Não foi possível copiar o link. Verifique a permissão da área de transferência e tente novamente.", "error");
                return;
            }
            showToast("Link copiado com sucesso.", "success");
        } finally {
            copyingRef.current.delete(clientId);
            setCopying(new Set(copyingRef.current));
        }
    };

    const openDeleteModal = (client: Client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setClientToDelete(null);
    };

    const handleDeleteClient = async () => {
        if (!clientToDelete) return;

        try {
            await deleteClient(clientToDelete.id);

            showToast(
                "Cliente excluído com sucesso.",
                "success"
            );
        } catch (error) {
            showToast(
                error instanceof Error
                    ? error.message
                    : "Não foi possível excluir o cliente.",
                "error"
            );
        } finally {
            closeDeleteModal();
        }
    };

    const linkButton = (client: Client) => {
        const label = client.name.trim()
            ? `Copiar link de acesso de ${client.name}` : "Copiar link de acesso do cliente";
        return <button type="button" title={label} aria-label={label}
            disabled={copying.has(client.id)} aria-busy={copying.has(client.id)}
            onClick={() => copyLink(client.id)}>
            {copying.has(client.id) ? <Loader2 size={18} className="clients__link-spinner" /> : <LinkIcon size={18} />}
        </button>;
    };

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

            matchesClientEmail(client.emails, term) ||

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

                                        {client.emails[0] || "Sem e-mail"}

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

                                            {linkButton(client)}

                                            <button
                                                type="button"
                                                title="Excluir cliente"
                                                aria-label="Excluir cliente"
                                                onClick={() => openDeleteModal(client)}
                                            >
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

                <p>{client.emails[0] || "Sem e-mail"}</p>

                <p>{client.phone}</p>

                <span>

                    Álbuns: {client.albumsCount}

                </span>

                <div className="clients__actions">

                    <button>

                        <Pencil size={18} />

                    </button>

                    {linkButton(client)}

                    <button
                        type="button"
                        title="Excluir cliente"
                        aria-label="Excluir cliente"
                        onClick={() => openDeleteModal(client)}
                    >
                        <Trash2 size={18} />
                    </button>

                </div>

            </div>

        ))

    )}

</div>


<DeleteConfirmModal
    open={showDeleteModal}
    title="Excluir cliente"
    message={`Deseja realmente excluir "${
        clientToDelete?.name.trim() || "Cliente sem nome"
    }"? Esta ação não poderá ser desfeita.`}
    onCancel={closeDeleteModal}
    onConfirm={handleDeleteClient}
/>
 
        </section>

    );

};

export default Clients;
