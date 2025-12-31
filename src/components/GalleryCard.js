import { Link } from "react-router-dom";

export default function GalleryCard({ id, image, title }) {
  return (
    <Link to={`/detail/${id}`} className="gallery-card">
      <img src={image} alt={title} />
      <div className="gallery-caption">{title}</div>
    </Link>
  );
}
