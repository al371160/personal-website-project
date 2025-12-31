export default function GalleryCard({ title, description, image }) {
  return (
    <div className="gallery-card">
      <div className="gallery-image">
        <img src={image} alt={title} />
      </div>

      <div className="gallery-info">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}
