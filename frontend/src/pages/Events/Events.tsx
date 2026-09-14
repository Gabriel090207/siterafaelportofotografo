import "./Events.css";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import { subscribeAlbums } from "../../services/firebase/feed";

import {
    getPublicFeedCategory,
    subscribeFeedCategories,
} from "../../services/firebase/feedCategory";

import type {
    FeedCategory,
} from "../../services/firebase/feedCategory";

function Events() {

const {
    categoryPath,
} = useParams();

const navigate = useNavigate();

const [albums, setAlbums] = useState<any[]>([]);

const [categories, setCategories] =
    useState<FeedCategory[]>([]);

const [albumsLoaded, setAlbumsLoaded] = useState(false);
const [categoriesLoaded, setCategoriesLoaded] = useState(false);
const [loadError, setLoadError] = useState(false);
const [bannerPosition, setBannerPosition] = useState({
    key: "",
    index: 0,
});
const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
const [categoryLookup, setCategoryLookup] = useState<{
    path: string;
    categoryId: string | null;
    bannerImages?: FeedCategory["bannerImages"];
} | null>(null);

const legacyCategoryName = categoryPath ?? "";

const directCategory =
    categories.find(
        category =>
            category.slug === categoryPath
    ) ??
    categories.find(
        category =>
            category.name.toLocaleLowerCase("pt-BR") ===
            legacyCategoryName.toLocaleLowerCase("pt-BR")
    );

const resolvedCategory =
    categories.find(
        (category) =>
            category.id === categoryLookup?.categoryId
    );

const currentCategory = useMemo(
    () =>
        directCategory ??
        (
            resolvedCategory
                ? {
                    ...resolvedCategory,
                    bannerImages:
                        categoryLookup?.bannerImages ??
                        resolvedCategory.bannerImages,
                }
                : undefined
        ),
    [
        categoryLookup?.bannerImages,
        directCategory,
        resolvedCategory,
    ],
);

const categoryBannerImages = useMemo(
    () => categoryPath && currentCategory
        ? (currentCategory.bannerImages ?? []).filter(
            (image) =>
                typeof image?.url === "string" &&
                image.url.trim().length > 0
        )
        : [],
    [categoryPath, currentCategory],
);

const categoryBannerKey = categoryBannerImages
    .map((image) => `${image.id}:${image.url}`)
    .join("|");

const bannerPositionKey = [
    currentCategory?.id ?? "",
    categoryBannerKey,
    prefersReducedMotion ? "reduced" : "animated",
].join("|");

const activeBannerIndex =
    bannerPosition.key === bannerPositionKey &&
    bannerPosition.index < categoryBannerImages.length
    ? bannerPosition.index
    : 0;
const categoryBannerImage = categoryBannerImages[activeBannerIndex];
const hasCategoryBanner = categoryBannerImages.length > 0;

    useEffect(() => {

        const unsubscribe =
            subscribeAlbums(
                (data) => {
                    setAlbums(data);
                    setAlbumsLoaded(true);
                },
                () => setLoadError(true),
            );

        return unsubscribe;

    }, []);

    useEffect(() => {

    const unsubscribe =
        subscribeFeedCategories(
            (data) => {
                setCategories(data);
                setCategoriesLoaded(true);
            },
            () => setLoadError(true),
        );

    return unsubscribe;

}, []);

useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );
    const updateReducedMotion = () => {
        setPrefersReducedMotion(reducedMotionQuery.matches);
    };

    updateReducedMotion();
    reducedMotionQuery.addEventListener("change", updateReducedMotion);

    return () => {
        reducedMotionQuery.removeEventListener("change", updateReducedMotion);
    };
}, []);

useEffect(() => {
    if (
        prefersReducedMotion ||
        !categoryPath ||
        categoryBannerImages.length < 2
    ) {
        return;
    }

    const intervalId = window.setInterval(() => {
        setBannerPosition((current) => {
            const currentIndex = current.key === bannerPositionKey
                ? current.index
                : 0;

            return {
                key: bannerPositionKey,
                index: (currentIndex + 1) % categoryBannerImages.length,
            };
        });
    }, 7000);

    return () => window.clearInterval(intervalId);
}, [
    categoryBannerImages.length,
    categoryBannerKey,
    categoryPath,
    bannerPositionKey,
    prefersReducedMotion,
]);

useEffect(() => {

    if (!categoryPath || !categoriesLoaded || directCategory) return;

    let cancelled = false;

    const resolveCategory = async () => {
        try {
            const result = await getPublicFeedCategory(categoryPath);

            if (cancelled) return;

            setCategoryLookup({
                path: categoryPath,
                categoryId: result?.categoryId ?? null,
                bannerImages: result?.bannerImages,
            });
        } catch {
            if (!cancelled) setLoadError(true);
        }
    };

    void resolveCategory();

    return () => {
        cancelled = true;
    };

}, [categoryPath, categoriesLoaded, directCategory]);

useEffect(() => {

    if (
        !categoryPath ||
        !categoriesLoaded ||
        !currentCategory?.slug ||
        categoryPath === currentCategory.slug
    ) {
        return;
    }

    navigate(
        `/eventos/${currentCategory.slug}`,
        { replace: true },
    );

}, [categoryPath, categoriesLoaded, currentCategory, navigate]);

    const events = useMemo(() => {

    return albums.filter(album => {

        if (album.status !== "published") {
            return false;
        }

        if (!currentCategory) {
            return true;
        }

        return (
            album.category ===
            currentCategory.id
        );

    });

}, [
    albums,
    currentCategory,
]);

const displayedAlbums = events;

const getAlbumCategorySlug = (album: { category?: string }) =>
    categories.find((category) => category.id === album.category)?.slug;

    if (loadError) {
        return (
            <main className="events">
                <div className="events-container">
                    <h1>Não foi possível carregar os eventos.</h1>
                </div>
            </main>
        );
    }

    if (
        !albumsLoaded ||
        !categoriesLoaded ||
        (
            categoryPath &&
            !directCategory &&
            categoryLookup?.path !== categoryPath
        )
    ) {
        return (
            <main className="events">
                <div className="events-container">
                    <p>Carregando eventos...</p>
                </div>
            </main>
        );
    }

    if (
        categoryPath &&
        !currentCategory &&
        categoryLookup?.path === categoryPath
    ) {
        return (
            <main className="events">
                <div className="events-container">
                    <h1>Categoria não encontrada.</h1>
                </div>
            </main>
        );
    }

    return (

        <main className="events">

            <div className="events-container">

                <section className="events-hero">

                    <div className="events-eyebrow">

                        <span></span>

                        <p>

                            PORTFÓLIO DE EVENTOS

                        </p>

                    </div>

                    <div className="events-hero-content">

                        <h1>

                            {currentCategory?.name ?? "Eventos"}

                        </h1>

                        <p className="events-description">

                            Fotógrafo a mais de 16 anos e especialista em festa de 15 anos, casamentos, formaturas, pré wedding, ensaio de gestante, eventos corporativos, aniversário infantil e book, Rafael Porto foi o primeiro fotógrafo no Brasil a entregar um álbum no próprio casamento, ama surpreender seus clientes e transformar momentos únicos em recordações eternas, possui mais de 50 prêmios por atendimento e qualidade, a empresa é a mais indicada em sua região a 6 anos consecutivos, atende Paraná e região. Tenha a tranquilidade e segurança em obter as melhores imagens dos momentos mais importantes da vida.

                        </p>

                    </div>

                </section>

                    <section className="featured-event">

                        <div className={`featured-event-card${hasCategoryBanner ? "" : " featured-event-card--empty"}`}>

                            {categoryBannerImage && (
                                <div className="featured-event-slides">
                                    {categoryBannerImages.map((image, index) => {
                                        const isActive =
                                            index === activeBannerIndex;

                                        return (
                                            <img
                                                key={image.id}
                                                src={image.url}
                                                className={
                                                    isActive ? "active" : ""
                                                }
                                                alt={
                                                    isActive
                                                        ? `Banner de ${currentCategory?.name}`
                                                        : ""
                                                }
                                                aria-hidden={!isActive}
                                                decoding="async"
                                            />
                                        );
                                    })}
                                </div>
                            )}

                        </div>

                    </section>

                <section className="events-grid-section">

                    <div className="events-grid">

                        {displayedAlbums.map((album) => (

                            <article
                                key={album.id}
                                className="event-card"
                            >

                                <div className="event-card-header">

                                    <div>

                                        <h3>

                                            {album.name}

                                        </h3>

                                        <span>

                                            {currentCategory?.name}

                                        </span>

                                    </div>

                                    {album.slug && getAlbumCategorySlug(album) && (
                                        <Link
                                            to={`/eventos/${getAlbumCategorySlug(album)}/${album.slug}`}
                                            className="event-card-button"
                                        >

                                            Ver Álbum

                                        </Link>
                                    )}

                                </div>

                                <div className="event-card-image">

                                    <img
                                        src={
                                            album.coverPhoto?.preview
                                        }
                                        alt={
                                            album.name
                                        }
                                    />

                                </div>

                                <div className="event-card-content">

                                    <p>

                                        {album.description}

                                    </p>

                                </div>

                            </article>

                        ))}

                    </div>

                    <div className="events-testimonials-action">
                        <Link
                            to="/depoimentos"
                            className="events-testimonials-button"
                        >
                            Veja o que os clientes dizem a nosso respeito
                        </Link>
                    </div>

                </section>

            </div>

        </main>

    );

}

export default Events;
