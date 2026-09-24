import "../ClientForm/ClientForm.css";
import "../Albums/Albums.css";


import { ArrowLeft, Eye, EyeOff, Images, Pencil, Plus, Save, Trash2 } from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getClient } from "../../services/firebase/clients";

import { revealClientPassword } from "../../services/api/clients";

import { subscribeAlbums } from "../../services/firebase/albumClient";
import type { AlbumClient } from "../../types/albumClient";


import DeleteConfirmModal from "../../components/DeleteConfirmModal/DeleteConfirmModal";

import { deleteFolder } from "../../services/firebase/storageService";

import { deleteAlbum } from "../../services/firebase/albumClient";

import { deleteDriveFolder } from "../../services/api/google";

import { useToast } from "../../contexts/ToastContext";

import { getErrorMessage } from "../../utils/errorMessage";

const EditClient = () => {
    const navigate = useNavigate();
    const { clientId } = useParams<{ clientId: string }>();

    const [client, setClient] = useState<Awaited<ReturnType<typeof getClient>>>(null);
    const [loading, setLoading] = useState(true);

    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordAbsent, setPasswordAbsent] = useState(false);

    const [albums, setAlbums] = useState<AlbumClient[]>([]);

    const { showToast } = useToast();

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [albumToDelete, setAlbumToDelete] =
        useState<AlbumClient | null>(null);

    useEffect(() => {
        if (!clientId) {
            navigate("/clients");
            return;
        }

        const loadClient = async () => {
            try {
                const data = await getClient(clientId);

                if (!data) {
                    navigate("/clients");
                    return;
                }

                setClient(data);
            } catch (error) {
                console.error("Erro ao carregar cliente:", error);
                navigate("/clients");
            } finally {
                setLoading(false);
            }
        };

        void loadClient();
    }, [clientId, navigate]);


    useEffect(() => {
        if (!clientId) return;

        const unsubscribe = subscribeAlbums((allAlbums) => {
            const clientAlbums = allAlbums.filter(
                (album) => album.clientId === clientId
            );

            setAlbums(clientAlbums);
        });

        return unsubscribe;
    }, [clientId]);

    if (loading) {
        return (
            <section>
                <p>Carregando cliente...</p>
            </section>
        );
    }

    if (!client) {
        return null;
    }


    
    const handleRevealPassword = async () => {
        if (!clientId || passwordLoading) return;

        if (password) {
            setPasswordVisible((current) => !current);
            return;
        }

        setPasswordLoading(true);

        try {
            const result = await revealClientPassword(clientId);

            setPassword(result.password);
            setPasswordVisible(true);
            setPasswordAbsent(false);
        } catch (error) {
            setPasswordAbsent(true);
            setPassword("");
            setPasswordVisible(false);
        } finally {
            setPasswordLoading(false);
        }
    };


    const handleDeleteAlbum = async () => {
        if (!albumToDelete) return;

        try {
            const albumFolder = albumToDelete.name
                .trim()
                .replace(/[\\/:*?"<>|]/g, "-");

            // Storage
            await deleteFolder(
                `AlbumClient/${albumToDelete.clientName}/${albumFolder}`
            );

            // Drive
            if (albumToDelete.driveFolderId) {
                await deleteDriveFolder({
                    folderId: albumToDelete.driveFolderId,
                });
            }

            // Firestore
            await deleteAlbum(albumToDelete.id!);

            showToast(
                "Álbum removido com sucesso!",
                "success"
            );
        } catch (error) {
            console.error(error);

            showToast(
                getErrorMessage(error),
                "error"
            );
        } finally {
            setShowDeleteModal(false);
            setAlbumToDelete(null);
        }
    };

    return (
        <section className="client-form">
            <div className="client-form__top">
                <button
                    type="button"
                    className="client-form__back"
                    onClick={() => navigate("/clients")}
                >
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                </button>

                <div className="client-form__title">
                    <h2>Editar Cliente</h2>
                    <p>
                        Gerencie as informações e os álbuns deste cliente.
                    </p>
                </div>
            </div>

            <div className="client-form__fields">

                <div className="client-form__card">
                    <h3>Informações</h3>

                    <div className="client-form__grid">
                        <div className="client-form__field">
                            <label>Nome</label>

                            <input
                                type="text"
                                value={client.name ?? ""}
                                readOnly
                            />
                        </div>

                        <div className="client-form__field">
                            <label>WhatsApp</label>

                            <input
                                type="text"
                                value={client.phone ?? ""}
                                readOnly
                            />
                        </div>

                        <div className="client-form__field">
                            <label>Status</label>

                            <select
                                value={client.active ? "active" : "inactive"}
                                disabled
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
                    <h3>E-mails</h3>

                    <div className="client-form__emails">
                        {client.emails?.length ? (
                            client.emails.map((email, index) => (
                                <div
                                    className="client-form__field"
                                    key={`${email}-${index}`}
                                >
                                    <label>
                                        E-mail {index + 1}
                                    </label>

                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="client-form__hint">
                                Nenhum e-mail cadastrado.
                            </p>
                        )}
                    </div>
                </div>

                
               <div className="client-form__card">
                    <h3>Acesso</h3>

                    <div className="client-form__field">
                        <label>Senha</label>

                        <div className="client-form__password-field">
                            <input
                                type={passwordVisible ? "text" : "password"}
                                value={
                                    passwordAbsent
                                        ? "Sem senha cadastrada"
                                        : password || "••••••••"
                                }
                                readOnly
                            />

                            {!passwordAbsent && (
                                <button
                                    type="button"
                                    className="client-form__password-toggle"
                                    onClick={handleRevealPassword}
                                    disabled={passwordLoading}
                                    aria-label={
                                        passwordVisible
                                            ? "Ocultar senha"
                                            : "Mostrar senha"
                                    }
                                    title={
                                        passwordVisible
                                            ? "Ocultar senha"
                                            : "Mostrar senha"
                                    }
                                >
                                    {passwordVisible ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>



            </div>


            <div className="client-form__albums">
                <div className="client-form__albums-header">
                    <div className="albums__header">
                        <div>
                            <h3>Álbuns</h3>
                        </div>

                        <button
                            type="button"
                            className="albums__new"
                            onClick={() =>
                                navigate(`/clients/${clientId}/albums/new`)
                            }
                        >
                            <Plus size={18} />
                            <span>Inserir álbum</span>
                        </button>
                    </div>
                </div>

                <div className="albums__grid">
                    {albums.length === 0 ? (
                        <div className="client-form__albums-empty">
                            <div className="client-form__albums-empty-icon">
                                <Images size={30} />
                            </div>

                            <h3>Nenhum álbum cadastrado</h3>

                            <p>
                                Quando este cliente possuir álbuns, eles aparecerão aqui.
                            </p>
                        </div>
                    ) : (
                        albums.map((album) => {
                            const totalPhotos =
                                (album.watermarkedPhotos?.length ?? 0) +
                                (album.highQualityPhotos?.length ?? 0);

                            const totalVideos =
                                (album.watermarkedVideos?.length ?? 0) +
                                (album.highQualityVideos?.length ?? 0);

                            return (
                                <div
                                    key={album.id}
                                    className="album-card"
                                >
                                    <div className="album-card__cover">
                                        {album.coverPhoto ? (
                                            <img
                                                src={album.coverPhoto.preview}
                                                alt={album.name}
                                            />
                                        ) : (
                                            <Images size={40} />
                                        )}
                                    </div>

                                    <div className="album-card__content">
                                        <h3>{album.name}</h3>

                                        <p>{album.clientName}</p>

                                        <span>
                                            {totalPhotos} Foto{totalPhotos !== 1 ? "s" : ""}
                                            {" • "}
                                            {totalVideos} Vídeo{totalVideos !== 1 ? "s" : ""}
                                        </span>
                                    </div>

                                    <div className="album-card__footer">
                                        <span
                                            className={`album-card__status album-card__status--${album.status}`}
                                        >
                                            {album.status === "published"
                                                ? "Publicado"
                                                : album.status === "draft"
                                                ? "Rascunho"
                                                : "Oculto"}
                                        </span>

                                        <div className="album-card__actions">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (album.slug) {
                                                        navigate(`/albuns/${album.slug}`);
                                                    }
                                                }}
                                                disabled={!album.slug}
                                                aria-label={`Editar álbum ${album.name}`}
                                            >
                                                <Pencil size={18} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAlbumToDelete(album);
                                                    setShowDeleteModal(true);
                                                }}
                                                aria-label={`Excluir álbum ${album.name}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <DeleteConfirmModal
                open={showDeleteModal}
                title="Excluir álbum"
                message={`Deseja realmente excluir "${albumToDelete?.name}"? Esta ação removerá o álbum e todos os arquivos armazenados.`}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setAlbumToDelete(null);
                }}
                onConfirm={handleDeleteAlbum}
            />

        </section>
    );

};

export default EditClient;