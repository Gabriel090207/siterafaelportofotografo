import "./Selections.css";

import { useEffect, useMemo, useState } from "react";

import {
    Search,
    Eye,
    Images,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import type { Selection } from "../../types/selection";

import {
    subscribeSelections,
} from "../../services/firebase/selection";

const Selections = () => {

    const navigate = useNavigate();

    const [selections, setSelections] =
        useState<Selection[]>([]);

    const [search, setSearch] =
        useState("");

    useEffect(() => {

        const unsubscribe =
            subscribeSelections(setSelections);

        return unsubscribe;

    }, []);

    const filteredSelections = useMemo(() => {

        const value =
            search.toLowerCase();

        return selections.filter((selection) =>

            selection.selectionName
                .toLowerCase()
                .includes(value) ||

            selection.personName
                .toLowerCase()
                .includes(value) ||

            selection.albumName
                .toLowerCase()
                .includes(value) ||

            selection.email
                .toLowerCase()
                .includes(value)

        );

    }, [selections, search]);

    return (

        <section className="selections">

            <div className="selections__header">

                <div>

                    <h2>Seleções</h2>

                    <p>

                        Visualize todas as seleções enviadas pelos clientes.

                    </p>

                </div>

            </div>

            <div className="selections__search">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Pesquisar seleção..."
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                />

            </div>

            <div className="selections__grid">

                {filteredSelections.length === 0 ? (

                    <div className="selections__empty">

                        Nenhuma seleção encontrada.

                    </div>

                ) : (

                    filteredSelections.map((selection) => (
  

                        <div
                            key={selection.id}
                            className="selection-card"
                        >

                            <div className="selection-card__cover">

                                {selection.photos.length > 0 ? (

                                    <img
                                        src={selection.photos[0].preview}
                                        alt={selection.selectionName}
                                    />

                                ) : (

                                    <Images size={42} />

                                )}

                            </div>

                            <div className="selection-card__content">

                                <h3>

                                    {selection.selectionName}

                                </h3>

                                <p>

                                    {selection.personName}

                                </p>

                                <span>

                                    {selection.email}

                                </span>

                                <span className="selection-card__info">

                                    <Images size={16} />

                                    {selection.totalPhotos} foto{selection.totalPhotos !== 1 ? "s" : ""}

                                </span>

                            </div>

                            <div className="selection-card__footer">

                                <span
                                    className={`selection-card__status selection-card__status--${selection.status}`}
                                >

                                    {selection.status === "pending"
                                        ? "Pendente"
                                        : selection.status === "completed"
                                        ? "Concluída"
                                        : selection.status}

                                </span>

                                <div className="selection-card__actions">

                                    <button
                                        onClick={() =>
                                            navigate(`/selections/${selection.clientId}/${selection.id}`)
                                        }
                                    >

                                        <Eye size={18} />

                                    </button>

                                </div>

                            </div>

                        </div>

                    ))

                )}

            </div>

        </section>

    );

};

export default Selections;