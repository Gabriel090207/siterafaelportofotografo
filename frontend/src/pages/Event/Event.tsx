import "./Event.css";

import {
  useState,
  useEffect,
  useRef,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";
import { X } from "lucide-react";

import {
    getPublicAlbumFeed,
    getPublicAlbumFeedByCategory,
    PublicAlbumFeedError,
} from "../../services/firebase/feed";

import {
    subscribeFeedCategories,
} from "../../services/firebase/feedCategory";

import type {
    FeedCategory,
} from "../../services/firebase/feedCategory";

import {
  FiGrid,
  FiShare2,
  FiDownloadCloud,
  FiArrowLeft,
  FiArrowRight,
  FiPause,
  FiPlay,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
} from "react-icons/fi";

const VIEWER_ANIMATION_MS = 300;

function Events() {

const navigate = useNavigate();

const {
    identifier,
    categorySlug,
    albumSlug,
} = useParams();

const [album, setAlbum] = useState<any>(null);

const [loadState, setLoadState] = useState<
    "loading" | "found" | "notFound" | "error"
>("loading");

const [loadedIdentifier, setLoadedIdentifier] =
    useState<string | null>(null);

const [categories, setCategories] =
    useState<FeedCategory[]>([]);

const [viewerIndex, setViewerIndex] = useState<number | null>(null);

const [viewerClosing, setViewerClosing] = useState(false);

const viewerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const viewerThumbnailsRef = useRef<HTMLDivElement | null>(null);
const activeViewerThumbnailRef = useRef<HTMLButtonElement | null>(null);

useEffect(() => {

    if (!identifier && (!categorySlug || !albumSlug)) return;

    let cancelled = false;

    const loadAlbum = async () => {
        setViewerIndex(null);
        setViewerClosing(false);

        try {
            const result = identifier
                ? await getPublicAlbumFeed(identifier)
                : await getPublicAlbumFeedByCategory(
                    categorySlug as string,
                    albumSlug as string,
                );

            if (cancelled) return;

            setAlbum(result.album);
            setLoadState("found");
            setLoadedIdentifier(identifier ?? albumSlug ?? null);

            const canonicalAlbumSlug = "canonicalAlbumSlug" in result
                ? result.canonicalAlbumSlug
                : result.canonicalSlug;

            if (
                canonicalAlbumSlug &&
                (
                    identifier ||
                    result.canonicalCategorySlug !== categorySlug ||
                    canonicalAlbumSlug !== albumSlug
                )
            ) {
                navigate(
                    `/eventos/${result.canonicalCategorySlug}/${canonicalAlbumSlug}`,
                    { replace: true },
                );
            }
        } catch (error) {
            if (cancelled) return;

            setAlbum(null);
            setLoadState(
                error instanceof PublicAlbumFeedError && error.status === 404
                    ? "notFound"
                    : "error"
            );
            setLoadedIdentifier(identifier ?? albumSlug ?? null);
        }
    };

    void loadAlbum();

    return () => {
        cancelled = true;
    };

}, [albumSlug, categorySlug, identifier, navigate]);


useEffect(() => {

    const unsubscribe =
        subscribeFeedCategories(
            setCategories
        );

    return unsubscribe;

}, []);

const currentCategory =
    categories.find(
        category =>
            category.id === album?.category
    );

const geralImages =
    album?.photos?.map(
        (photo: any) => photo.preview
    ) ?? [];

const contentData = {

    geral: {

        title: "Fotos Gerais",

        description: "Confira todos os registros do evento",

        images: geralImages,

    },

    ...(album?.categories ?? []).reduce(

        (acc: any, category: any) => {

            acc[category.id] = {

                title: category.name,

                description: category.name,

                images: category.photos.map(

                    (photo: any) => photo.preview

                ),

            };

            return acc;

        },

        {}

    ),

};

const [activeContent, setActiveContent] =
    useState("geral");

const currentContent =
    contentData[
        activeContent as keyof typeof contentData
    ] ??
    contentData.geral;

const [currentImage, setCurrentImage] = useState(0);

const currentImages: string[] = Array.isArray(currentContent.images)
    ? currentContent.images
    : [];

const viewerImage = viewerIndex !== null
    ? currentImages[viewerIndex] ?? null
    : null;

const previousViewerDisabled =
    viewerClosing || viewerIndex === null || viewerIndex <= 0;

const nextViewerDisabled =
    viewerClosing
    || viewerIndex === null
    || viewerIndex >= currentImages.length - 1;

const [previewStart, setPreviewStart] = useState(0);

const [isPaused, setIsPaused] = useState(false);

const [manualControl, setManualControl] =
  useState(false);




const videoRef = useRef<HTMLVideoElement | null>(
  null
);

const [isPlaying, setIsPlaying] =
  useState(true);


const [isMuted, setIsMuted] =
  useState(true);


const [currentTime, setCurrentTime] =
  useState(0);

const [duration, setDuration] =
  useState(0);


const [volume, setVolume] =
  useState(0);



const isMobile =
  window.innerWidth <= 900;

const visiblePreviews =
  isMobile ? 3 : 5;

const previewMove =
  isMobile ? 34.5 : 20.4;

const nextPreview = () => {
  if (
    previewStart <
    currentImages.length - visiblePreviews
  ) {
    setPreviewStart(prev => prev + 1);
  }
};

const prevPreview = () => {
  if (previewStart > 0) {
    setPreviewStart(prev => prev - 1);
  }
};

const openViewer = () => {
  if (
    currentImage < 0
    || currentImage >= currentImages.length
    || !currentImages[currentImage]
    || viewerTimerRef.current
  ) return;

  setViewerClosing(false);
  setViewerIndex(currentImage);
};

const closeViewer = () => {
  if (viewerIndex === null || viewerTimerRef.current) return;

  setViewerClosing(true);
  viewerTimerRef.current = setTimeout(() => {
    setViewerIndex(null);
    setViewerClosing(false);
    viewerTimerRef.current = null;
  }, VIEWER_ANIMATION_MS);
};

const navigateViewer = (direction: -1 | 1) => {
  if (viewerClosing) return;

  setViewerIndex((current) => {
    if (
      current === null
      || current < 0
      || current >= currentImages.length
      || !currentImages[current]
    ) return current;

    const nextIndex = current + direction;

    if (
      nextIndex < 0
      || nextIndex >= currentImages.length
      || !currentImages[nextIndex]
    ) return current;

    return nextIndex;
  });
};

const showViewerImage = (index: number) => {
  if (
    viewerClosing
    || index < 0
    || index >= currentImages.length
    || !currentImages[index]
  ) return;

  setViewerIndex(index);
};

const changeActiveContent = (content: string) => {
  if (viewerTimerRef.current) {
    clearTimeout(viewerTimerRef.current);
    viewerTimerRef.current = null;
  }

  setViewerIndex(null);
  setViewerClosing(false);
  setActiveContent(content);
};

useEffect(() => {
  return () => {
    if (viewerTimerRef.current) {
      clearTimeout(viewerTimerRef.current);
    }
  };
}, []);

useEffect(() => {
  if (!viewerImage) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [viewerImage]);

useEffect(() => {
  if (!viewerImage) return;

  const handleViewerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeViewer();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateViewer(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateViewer(1);
    }
  };

  document.addEventListener("keydown", handleViewerKeyDown);
  return () => document.removeEventListener("keydown", handleViewerKeyDown);
}, [closeViewer, navigateViewer, viewerImage]);

useEffect(() => {
  if (!viewerImage || viewerIndex === null) return;

  const thumbnails = viewerThumbnailsRef.current;
  const activeThumbnail = activeViewerThumbnailRef.current;

  if (!thumbnails || !activeThumbnail) return;

  const thumbnailsRect = thumbnails.getBoundingClientRect();
  const activeThumbnailRect = activeThumbnail.getBoundingClientRect();

  if (
    activeThumbnailRect.left >= thumbnailsRect.left
    && activeThumbnailRect.right <= thumbnailsRect.right
  ) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const centeredPosition = thumbnails.scrollLeft
    + activeThumbnailRect.left
    + activeThumbnailRect.width / 2
    - thumbnailsRect.left
    - thumbnailsRect.width / 2;

  thumbnails.scrollTo({
    left: Math.max(0, centeredPosition),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}, [viewerImage, viewerIndex]);






const handlePlayPause = () => {

  if (!videoRef.current) return;

  if (videoRef.current.paused) {

    videoRef.current.play();

    setIsPlaying(true);

  } else {

    videoRef.current.pause();

    setIsPlaying(false);

  }

};


const handleMute = () => {

  if (!videoRef.current) return;

  if (videoRef.current.muted) {

    videoRef.current.muted = false;

    videoRef.current.volume = 0.5;

    setVolume(0.5);

    setIsMuted(false);

} else {

  videoRef.current.muted = true;

  setVolume(0);

  setIsMuted(true);

}

};

const handleFullscreen = () => {

  if (!videoRef.current) return;

  if (document.fullscreenElement) {

    document.exitFullscreen();

  } else {

    videoRef.current.requestFullscreen();

  }

};


const formatTime = (
  time: number
) => {

  const minutes =
    Math.floor(time / 60);

  const seconds =
    Math.floor(time % 60);

  return `${minutes}:${
    seconds < 10
      ? "0" + seconds
      : seconds
  }`;

};



const handleSeek = (
  event: React.MouseEvent<HTMLDivElement>
) => {

  if (
    !videoRef.current ||
    !duration
  ) return;

  const rect =
    event.currentTarget.getBoundingClientRect();

  const clickX =
    event.clientX - rect.left;

  const percentage =
    clickX / rect.width;

  const newTime =
    percentage * duration;

  videoRef.current.currentTime =
    newTime;

  setCurrentTime(newTime);

};


const handleVolumeChange = (
  event: React.MouseEvent<HTMLDivElement>
) => {

  if (!videoRef.current) return;

  const rect =
    event.currentTarget.getBoundingClientRect();

  const clickX =
    event.clientX - rect.left;

  const newVolume =
    Math.min(
      Math.max(
        clickX / rect.width,
        0
      ),
      1
    );

 videoRef.current.volume =
  newVolume;

setVolume(newVolume);

if (newVolume === 0) {

  videoRef.current.muted = true;

  setIsMuted(true);

} else {

  videoRef.current.muted = false;

  setIsMuted(false);

}

};

useEffect(() => {

  if (isPaused || manualControl || viewerIndex !== null) return;

  const interval = setInterval(() => {

    setCurrentImage(prev =>
  prev === currentImages.length - 1
    ? 0
    : prev + 1
);

  }, 4500);

  return () => clearInterval(interval);

}, [
  isPaused,
  manualControl,
  currentImages.length,
  viewerIndex
]);


  const requestedIdentifier = identifier ?? albumSlug ?? null;

  if (loadState === "loading" || loadedIdentifier !== requestedIdentifier) {
    return (
      <main className="event">
        <div className="event-container">
          <p>Carregando evento...</p>
        </div>
      </main>
    );
  }

  if (loadState === "notFound") {
    return (
      <main className="event">
        <div className="event-container">
          <h1>Evento não encontrado.</h1>
        </div>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="event">
        <div className="event-container">
          <h1>Não foi possível carregar o evento.</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="event">
      <div className="event-container">

        <section className="event-hero">

           


       
          <div className="event-eyebrow">
  <span></span>
 <p>

{currentCategory?.name}

</p>
</div>

<div className="event-hero-content">

 <h1>

  {album?.name}

</h1>

<p className="event-description">

  {album?.description}

</p>

</div>

        </section>




       
        <section className="event-content">

  <div className="event-layout">

    <aside className="event-sidebar">

      <button className="event-sidebar-item active">
        <FiGrid />
        <span>Feed</span>
      </button>

       

      <button className="event-sidebar-item">
        <FiDownloadCloud />
        <span>Baixar</span>
      </button>

      

     

      <button className="event-sidebar-item">
        <FiShare2 />
        <span>Compartilhar</span>
      </button>

     

    </aside>

  <div className="event-feed">

  <div className="event-post">

   

{activeContent !== "video" && (
  <>
    <button
      type="button"
      className="event-post-media"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={openViewer}
      aria-label={`Ampliar ${currentContent.title}`}
    >
      {currentImages.map((image, index) => (
        <img
          key={`${image}-${index}`}
          src={image}
          alt=""
          className={
            index === currentImage
              ? "active"
              : ""
          }
        />
      ))}
    </button>

    <div className="event-post-preview">

      <button
        className="preview-arrow"
        onClick={prevPreview}
      >
        <FiArrowLeft />
      </button>

      <div className="preview-images-wrapper">

        <div
          className="preview-images"
          style={{
            transform: `translateX(
              -${previewStart * previewMove}%
            )`,
          }}
        >

          {currentImages.map(
            (image, index) => (
              <button
                key={`${image}-${index}`}
                className={`preview-item ${
                  index === currentImage
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setManualControl(true);
                  setCurrentImage(index);
                }}
              >
                <img
                  src={image}
                  alt=""
                />
              </button>
            )
          )}

        </div>

      </div>

      <button
        className="preview-arrow"
        onClick={nextPreview}
      >
        <FiArrowRight />
      </button>

    </div>
  </>
)}

{activeContent === "video" && (

  <>
    
    <video
  ref={videoRef}
  className="event-video-player"
      autoPlay
      muted
      playsInline
      loop
      onTimeUpdate={() => {

  if (!videoRef.current) return;

  setCurrentTime(
    videoRef.current.currentTime
  );

}}

onLoadedMetadata={() => {

  if (!videoRef.current) return;

  setDuration(
    videoRef.current.duration
  );

 

}}
    >
      <source
        src={album?.videos?.[0]?.preview}
        type="video/mp4"
      />
    </video>

    <div className="event-video-controls">

      <button
  className="video-control-btn"
  onClick={handlePlayPause}
>

  {isPlaying
    ? <FiPause />
    : <FiPlay />
  }

</button>

     <span className="video-time">
  {formatTime(currentTime)}
</span>

      <div
  className="video-progress"
  onClick={handleSeek}
>

    <div
  className="video-progress-fill"
  style={{
    width: `${
      duration
        ? (currentTime /
            duration) *
          100
        : 0
    }%`
  }}
>

  <div className="video-progress-thumb" />

</div>

      </div>

      <span className="video-time">
  {formatTime(duration)}
</span>

     <button
  className="video-control-btn"
  onClick={handleMute}
>
  {isMuted
  ? <FiVolumeX />
  : <FiVolume2 />
}
</button>

<div
  className="video-volume"
  onClick={handleVolumeChange}
>

  <div
    className="video-volume-fill"
    style={{
      width: `${volume * 100}%`
    }}
  >

    <div className="video-volume-thumb" />

  </div>

</div>

     <button
  className="video-control-btn"
  onClick={handleFullscreen}
>
  <FiMaximize />
</button>

    </div>

  </>

)}



  </div>


  

</div>


<aside className="event-video-sidebar">



{album?.videos?.length > 0 &&
 activeContent !== "video" && (
  <div className="video-category">

    <span className="video-sidebar-label">
      VÍDEO
    </span>

    <button
      className="video-preview-card"
      onClick={() => changeActiveContent("video")}
    >
      <video
        src={album?.videos?.[0]?.preview}
        muted
        playsInline
        preload="metadata"
      />

      <div className="video-play">
        <div className="video-play-circle">
          ▶
        </div>
      </div>
    </button>

  </div>
)}

  {activeContent !== "geral" && (
    <div className="video-category">

      <span className="video-sidebar-label">
        GERAL
      </span>

      <button
        className="video-category-card"
        onClick={() => changeActiveContent("geral")}
      >
       <img
  src={album?.coverPhoto?.preview}
  alt={album?.name}
/>
      </button>

    </div>
  )}


{(album?.categories ?? []).map((category: any) => {

    if (activeContent === category.id) return null;

    return (

        <div
            key={category.id}
            className="video-category"
        >

            <span className="video-sidebar-label">

                {category.name.toUpperCase()}

            </span>

            <button
                className="video-category-card"
                onClick={() => changeActiveContent(category.id)}
            >

                <img
                    src={
                        category.photos?.[0]?.preview
                    }
                    alt={category.name}
                />

            </button>

        </div>

    );

})}

</aside>




  </div>




 

</section>

      </div>


      <button
  type="button"
  className="event-back-button event-back-button--bottom"
  onClick={() =>
    navigate(
      currentCategory?.slug
        ? `/eventos/${currentCategory.slug}`
        : "/eventos"
    )
  }
>
  <FiArrowLeft />
  <span>Voltar</span>
</button>

      {viewerImage && (
        <div
          className={`event-viewer${viewerClosing ? " event-viewer--closing" : ""}`}
          onClick={closeViewer}
          role="presentation"
        >
          <button
            type="button"
            className="event-viewer__close"
            onClick={(event) => {
              event.stopPropagation();
              closeViewer();
            }}
            aria-label="Fechar visualizador"
          >
            <X size={24} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="event-viewer__navigation event-viewer__navigation--previous"
            onClick={(event) => {
              event.stopPropagation();
              navigateViewer(-1);
            }}
            disabled={previousViewerDisabled}
            aria-label="Foto anterior"
          >
            <FiArrowLeft aria-hidden="true" />
          </button>

          <button
            type="button"
            className="event-viewer__navigation event-viewer__navigation--next"
            onClick={(event) => {
              event.stopPropagation();
              navigateViewer(1);
            }}
            disabled={nextViewerDisabled}
            aria-label="Próxima foto"
          >
            <FiArrowRight aria-hidden="true" />
          </button>

          <div className="event-viewer__layout">
            <div
              className="event-viewer__content"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Visualização ampliada de ${currentContent.title}`}
            >
              <img src={viewerImage} alt={currentContent.title} />
            </div>

            <div
              ref={viewerThumbnailsRef}
              className="event-viewer__thumbnails"
              onClick={(event) => event.stopPropagation()}
              role="group"
              aria-label="Fotos do evento"
            >
              {currentImages.map((image, index) => {
                const isActive = index === viewerIndex;

                return (
                  <button
                    key={`${image}-${index}`}
                    ref={isActive ? activeViewerThumbnailRef : undefined}
                    type="button"
                    className={`event-viewer__thumbnail${isActive ? " event-viewer__thumbnail--active" : ""}`}
                    onClick={() => showViewerImage(index)}
                    disabled={viewerClosing || !image}
                    aria-label={`Abrir foto ${index + 1}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {image && (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Events;
