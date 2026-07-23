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

import {
    doc,
    onSnapshot,
} from "firebase/firestore";

import db from "../../firebase/firestore";

import {
  FiGrid,
  FiHeart,
  FiShare2,
  FiDownloadCloud,
  FiMessageCircle,
  FiArrowLeft,
  FiArrowRight,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiCamera,
  FiPause,
  FiPlay,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
} from "react-icons/fi";

function Events() {

const navigate = useNavigate();

const { id } = useParams();

const [album, setAlbum] = useState<any>(null);


useEffect(() => {

    if (!id) return;

    const unsubscribe = onSnapshot(

    doc(db, "AlbumFeed", id),

    (snapshot) => {

        if (snapshot.exists()) {

            setAlbum({

                id: snapshot.id,

                ...snapshot.data(),

            });

        }

    }

);

    return unsubscribe;

}, [id]);

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

  if (isPaused || manualControl) return;

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
  currentImages.length
]);


const totalPhotos =
    (album?.photos?.length ?? 0) +
    (album?.categories ?? []).reduce(
        (total: number, category: any) =>
            total + (category.photos?.length ?? 0),
        0
    );

  return (
    <main className="event">
      <div className="event-container">

        <section className="event-hero">

           <button
    className="event-back-button"
    onClick={() => navigate(-1)}
  >
    <FiArrowLeft />
    <span>Voltar</span>
  </button>


       
          <div className="event-eyebrow">
  <span></span>
 <p>

  {album?.category}

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


        <section className="event-album-info">

  <div className="event-album-info-card">

    <FiMapPin />

    <div>
      <strong>Local</strong>
      <span>
    {album?.eventLocation || "Local não informado"}
</span>
    </div>

  </div>

  <div className="event-album-info-card">

    <FiCalendar />

    <div>
      <strong>Data</strong>
    <span>
    {album?.eventDate
        ? new Date(album.eventDate).toLocaleDateString(
              "pt-BR",
              {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
              }
          )
        : "Data não informada"}
</span>
    </div>

  </div>

  <div className="event-album-info-card">

    <FiClock />

    <div>
      <strong>Horário</strong>
      <span>
    {album?.eventTime || "Horário não informado"}
</span>
    </div>

  </div>

  <div className="event-album-info-card">

    <FiCamera />

    <div>
     <strong>Fotos</strong>

<span>
    {totalPhotos} registros
</span>
    </div>

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
        <FiMessageCircle />
        <span>Comentários</span>
      </button>

      <button className="event-sidebar-item">
        <FiDownloadCloud />
        <span>Baixar</span>
      </button>

      

      <button className="event-sidebar-item">
        <FiHeart />
        <span>Destacar</span>
      </button>

      <button className="event-sidebar-item">
        <FiShare2 />
        <span>Compartilhar</span>
      </button>

     

    </aside>

  <div className="event-feed">

  <div className="event-post">

   <div className="event-post-header">

  <div>

   <h3>{currentContent.title}</h3>

<span>
  {currentContent.description}
</span>

   

  </div>

</div>

{activeContent !== "video" && (
  <>
    <div
      className="event-post-media"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
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
    </div>

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
        src="https://www.w3schools.com/html/mov_bbb.mp4"
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
      onClick={() =>
        setActiveContent("video")
      }
    >
      <img
        src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc"
        alt="Filme"
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
        onClick={() =>
          setActiveContent("geral")
        }
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
                onClick={() =>
                    setActiveContent(category.id)
                }
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
    </main>
  );
}

export default Events;