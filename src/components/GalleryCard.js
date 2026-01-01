import { Link } from "react-router-dom";

export default function GalleryCard({
  id,
  title,
  description,
  image,
  video,
}) {
  return (
    <Link to={`/detail/${id}`} className="gallery-card">
      <div className="gallery-media">
        {video ? (
          <video
            src={video}
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img src={image} alt={title} />
        )}
      </div>

      <div className="gallery-meta">
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </div>
    </Link>
  );
}
