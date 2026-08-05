import "./SelectionDetails.css";

import { ArrowLeft, Download } from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { getSelection } from "../../services/firebase/selection";

import type { Selection } from "../../types/selection";

import { getClient } from "../../services/firebase/clients";

import { getAlbum } from "../../services/firebase/albumClient";


const SelectionDetails = () => {

const navigate = useNavigate();

const { clientId, selectionId } = useParams();

const [selection, setSelection] = useState<Selection | null>(null);

const [clientName, setClientName] = useState("");

const [album, setAlbum] = useState<any>(null);

const [downloading, setDownloading] = useState(false);

useEffect(() => {

    if (!clientId || !selectionId) return;

    const loadSelection = async () => {

        const data = await getSelection(
            clientId,
            selectionId
        );

       setSelection(data);

            if (data) {

                const client = await getClient(data.clientId);

                setClientName(client?.name ?? "");

                const album = await getAlbum(data.albumId);

                setAlbum(album);

                console.log("Album carregado");
                console.log(album);

            }

    };

    loadSelection();

}, [clientId, selectionId]);


console.log("Fotos da seleção");
console.log(selection?.photos);

console.log("Fotos em alta");
console.log(album?.highQualityPhotos);


const handleDownloadSelection = async () => {
    if (!selection) return;

    try {
        setDownloading(true);

        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/selection/download`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clientId: selection.clientId,
                    selectionId: selection.id,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();

            console.error(error);

            alert(error.detail);

            return;
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = `${selection.selectionName}.zip`;

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
        alert("Erro ao baixar a seleção.");
    } finally {
        setDownloading(false);
    }
};


    return (

        <section className="selection-details">

            <div className="selection-details__top">

                <button
                    className="selection-details__back"
                    onClick={() => navigate("/selections")}
                >

                    <ArrowLeft size={18} />

                    <span>Voltar</span>

                </button>

                <div className="selection-details__title">

                    <h2>Seleção</h2>

                    <p>

                        Visualize as fotos escolhidas pelo cliente.

                    </p>

                </div>

            </div>

            <div className="selection-details__card">

                <h3>Informações da Seleção</h3>

                <div className="selection-details__grid">

                    <div className="selection-details__field">

                        <label>Cliente</label>

                        <span>{clientName}</span>

                    </div>

                    <div className="selection-details__field">

                        <label>Pessoa</label>

                        <span>{selection?.personName}</span>

                    </div>

                    <div className="selection-details__field">

                        <label>E-mail</label>

                        <span>{selection?.email}</span>

                    </div>

                    <div className="selection-details__field">

                        <label>Álbum</label>

                        <span>{selection?.albumName}</span>

                    </div>

                    <div className="selection-details__field">

                        <label>Status</label>

                        <span>

                            {selection?.status === "pending"
                                ? "Pendente"
                                : "Concluída"}

                        </span>

                    </div>

                    <div className="selection-details__field">

                        <label>Fotos Selecionadas</label>

                        <span>{selection?.totalPhotos}</span>

                    </div>

                </div>

            </div>

            <div className="selection-details__card">

                <h3>Fotos Selecionadas</h3>

                <div className="selection-details__photos">

                    {selection?.photos.map((photo) => (

                        <div
                            key={photo.name}
                            className="selection-details__photo"
                        >

                            <img
                                src={photo.preview}
                                alt={photo.name}
                            />

                        </div>

                    ))}

                </div>

            </div>

            <div className="selection-details__actions">

                <button
                    className="selection-details__download"
                    onClick={handleDownloadSelection}
                    disabled={downloading}
                >

                    <Download size={18} />

                    <span>

                        {downloading ? "Baixando..." : "Baixar Seleção"}

                    </span>

                </button>

            </div>

        </section>

    );

};

export default SelectionDetails;