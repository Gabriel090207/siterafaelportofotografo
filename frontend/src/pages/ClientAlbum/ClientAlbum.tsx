import "./ClientAlbum.css";

import { useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Heart,
    Image,
    Video,
    X,
} from "lucide-react";

import ClientHeader from "../../components/ClientHeader/ClientHeader";

import { subscribeAlbum } from "../../firebase/albums";

function ClientAlbum() {

    const { albumId } = useParams();

    const [album, setAlbum] = useState<any>(null);

    const [filter, setFilter] = useState("photos");

    const [selectionMode, setSelectionMode] = useState(false);

    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const [showFinishModal, setShowFinishModal] = useState(false);

    const [previewImage, setPreviewImage] = useState<any>(null);

    const [closingPreview, setClosingPreview] = useState(false);

    useEffect(() => {

        if (!albumId) return;

        const unsubscribe = subscribeAlbum(
            albumId,
            setAlbum
        );

        return unsubscribe;

    }, [albumId]);

    const items =
        filter === "photos"
            ? album?.watermarkedPhotos ?? []
            : album?.watermarkedVideos ?? [];


    useEffect(() => {

        if (showFinishModal) {

            document.body.style.overflow = "hidden";

        } else {

            document.body.style.overflow = "";

        }

        return () => {

            document.body.style.overflow = "";

        };

    }, [showFinishModal]);



    const toggleSelection = (id: string) => {

        setSelectedItems((current) =>

            current.includes(id)
                ? current.filter(item => item !== id)
                : [...current, id]

        );

    };


    const closePreview = () => {

    setClosingPreview(true);

    setTimeout(() => {

        setPreviewImage(null);

        setClosingPreview(false);

    }, 250);

};

    return (

        <main className="client-album">

            <ClientHeader />

            <div className="client-album__container">

                <div className="client-album__actions">

                    <Link
                        to="/cliente/dashboard"
                        className="client-album__back"
                    >

                        <ArrowLeft size={18} />

                        Voltar

                    </Link>

                    <div className="client-album__filter">

                        <select

                            value={filter}

                            onChange={(e) =>
                                setFilter(e.target.value)
                            }

                        >

                            <option value="photos">

                                Fotos

                            </option>

                            <option value="videos">

                                Vídeos

                            </option>

                        </select>

                    </div>

                    <button
    className="client-album__selection"
    onClick={() => setSelectionMode(!selectionMode)}
>
    {selectionMode ? (
        <X size={18} />
    ) : (
        <Heart size={18} />
    )}

    {selectionMode
        ? "Cancelar Seleção"
        : "Criar Seleção"}
</button>

                </div>

                <section className="client-album__gallery">

                    {items.map((item: any) => (

                        <div
    key={item.id}
    className="client-media-card"
    onClick={() => {

    setPreviewImage(item);

}}
>

    {selectionMode && (
       <button
    className={`client-media-card__favorite ${
        selectedItems.includes(item.id)
            ? "client-media-card__favorite--active"
            : ""
    }`}
    onClick={(e) => {

        e.stopPropagation();

        toggleSelection(item.id);

    }}
>
    <Heart
        size={18}
        fill={
            selectedItems.includes(item.id)
                ? "currentColor"
                : "none"
        }
    />
</button>
    )}

    {filter === "photos" ? (

        <img
            src={item.preview}
            alt={item.name}
        />

    ) : item.preview ? (

        <img
            src={item.preview}
            alt={item.name}
        />

    ) : (

        <div className="client-media-card__video">
            <Video size={34} />
        </div>

    )}

</div>

                            

                    ))}

                    {items.length === 0 && (

                        <div className="client-album__empty">

                            <Image size={34} />

                            Nenhum item encontrado.

                        </div>

                    )}

                </section>

            </div>



            {selectionMode && (
    <button
    className="client-album__finish"
    onClick={() => setShowFinishModal(true)}
>
        Finalizar

        {selectedItems.length > 0 && (
            <span>
                {selectedItems.length}
            </span>
        )}
    </button>
)}


{showFinishModal && (

    <div
        className="client-album-modal"
        onClick={() => setShowFinishModal(false)}
    >

        <div
            className="client-album-modal__content"
            onClick={(e) => e.stopPropagation()}
        >

            <button
                className="client-album-modal__close"
                onClick={() => setShowFinishModal(false)}
            >
                <X size={20} />
            </button>

            <h2 className="client-album-modal__title">

                Finalizar Seleção

            </h2>

            <div className="client-album-modal__group">

                <label>

                    Nome da seleção

                </label>

                <input
                    type="text"
                    placeholder="Ex.: Família da Noiva"
                />

            </div>

            <div className="client-album-modal__row">

                <div className="client-album-modal__group">

                    <label>

                        Nome da pessoa

                    </label>

                    <input
                        type="text"
                        placeholder="Nome completo"
                    />

                </div>

                <div className="client-album-modal__group">

                    <label>

                        Contato

                    </label>

                    <input
                        type="text"
                        placeholder="Telefone ou WhatsApp"
                    />

                </div>

            </div>

            <button
                className="client-album-modal__submit"
            >

                Completar

            </button>

        </div>

    </div>

)}



{previewImage && (

    <div
    className={`client-preview ${
        closingPreview
            ? "client-preview--closing"
            : ""
    }`}
        onClick={closePreview}
    >

        <button
            className="client-preview__close"
            onClick={closePreview}
        >
            <X size={24} />
        </button>

        <div
            className="client-preview__content"
            onClick={(e) => e.stopPropagation()}
        >

            <img
                src={previewImage.preview}
                alt={previewImage.name}
            />

        </div>

    </div>

)}


        </main>

    );

}

export default ClientAlbum;