import { useRef } from "react";
import { Link } from "react-router-dom";
import { optimizeImage } from "../utils/cloudinary";
import VideoPlayer from "./VideoPlayer";

// Cards are a third of the page (~500px); 2x covers retina, and phones show one full-width column.
const CARD_WIDTH = 1200;
const PREVIEW_SECONDS = 8;

export default function GalleryCard({ slug, title, hero, featured = false }) {
  const videoRef = useRef(null);
  const isVideo = hero?.type === "video";

  return (
    <Link
      to={`/work/${slug}`}
      className={`gallery-card${featured ? " gallery-card--featured" : ""}`}
      onMouseEnter={isVideo ? () => videoRef.current?.play() : undefined}
      onMouseLeave={isVideo ? () => videoRef.current?.pause() : undefined}
    >
      <div className="gallery-media">
        {isVideo ? (
          <VideoPlayer
            ref={videoRef}
            src={hero.src}
            width={CARD_WIDTH}
            duration={PREVIEW_SECONDS}
            mode="hover"
            title={title}
          />
        ) : (
          <img src={optimizeImage(hero?.src, CARD_WIDTH)} alt={title} />
        )}
      </div>
      <div className="gallery-meta">
        <span className="gallery-title">{title}</span>
      </div>
    </Link>
  );
}
