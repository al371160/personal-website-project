import { useRef } from "react";
import { Link } from "react-router-dom";
import { optimizeImage } from "../utils/cloudinary";
import VideoPlayer from "./VideoPlayer";

// Cards are a third of the page (~500px); 2x covers retina, and phones show one full-width column.
const CARD_WIDTH = 1200;
const PREVIEW_SECONDS = 8;

export default function GalleryCard({ slug, title, hero, featured = false, comingSoon = false }) {
  const videoRef = useRef(null);
  const isVideo = hero?.type === "video";
  const featuredClass = featured ? " gallery-card--featured" : "";

  // Unfinished projects: not a link; hovering darkens the thumbnail and says so.
  if (comingSoon) {
    return (
      <div
        className={`gallery-card gallery-card--soon${featuredClass}`}
        aria-label={`${title} (coming soon)`}
      >
        <div className={`gallery-media${hero ? "" : " gallery-media--placeholder"}`}>
          {hero && !isVideo && <img src={optimizeImage(hero.src, CARD_WIDTH)} alt="" />}
          {hero && isVideo && (
            <VideoPlayer src={hero.src} width={CARD_WIDTH} duration={PREVIEW_SECONDS} mode="hover" title={title} />
          )}
          <span className="gallery-soon-overlay" aria-hidden="true">
            Coming soon!
          </span>
        </div>
        <div className="gallery-meta">
          <span className="gallery-title">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/work/${slug}`}
      className={`gallery-card${featuredClass}`}
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
