import "./Feed.css";

import {
    Plus,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
    feedCategories,
} from "../../data/feedCategories";

const Feed = () => {

const navigate = useNavigate();

    return (

        <section className="albums">

            <div className="albums__header">

                <div>

                    <h2>Feed</h2>

                    <p>

    Gerencie os trabalhos publicados no feed do site.

</p>

                </div>

                <button
                    className="albums__new"
                    onClick={() =>
                        navigate("/feed/new")
                    }
                >

                    <Plus size={18} />

                    <span>

                        Novo Feed

                    </span>

                </button>

            </div>

         
            <div className="albums__grid">

    {feedCategories.map((category) => (

        <div
            key={category.id}
            className="album-card"
        >

            <div className="album-card__cover">

                <img
                    src={category.cover}
                    alt={category.name}
                />

            </div>

            <div className="album-card__content">

                <h3>

                    {category.name}

                </h3>

            </div>

            <div className="album-card__footer">

                <button
                    className="albums__new"
                    onClick={() =>
    navigate(`/feed/${category.id}`)
}
                >

                    Ver Feed

                </button>

            </div>

        </div>

    ))}

</div>

        </section>

    );

};

export default Feed;