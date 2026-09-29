import { optimizeImage } from "../utils/cloudinary";

// Content column is ~1000px wide; 2x covers retina. Multi-column galleries
// collapse to one column on phones, so they still need ~1200px.
const FULL_WIDTH = 2000;
const GALLERY_TILE_WIDTH = 1200;

function renderMedia(item, width) {
  if (item.type === "video") {
    return (
      <video src={item.src} autoPlay muted loop playsInline />
    );
  }
  return <img src={optimizeImage(item.src, width)} alt={item.caption || ""} />;
}

function TextBody({ body }) {
  const paragraphs = Array.isArray(body)
    ? body
    : String(body).split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="detail-text-body">
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

export default function DetailContentBlock({ block, index }) {
  if (block.type === "text") {
    return (
      <section key={index} className="detail-text-block">
        {block.title && <h2 className="detail-text-title">{block.title}</h2>}
        <TextBody body={block.body} />
      </section>
    );
  }

  if (block.type === "gallery") {
    const width = (block.columns || 1) > 1 ? GALLERY_TILE_WIDTH : FULL_WIDTH;
    return (
      <div
        key={index}
        className="detail-gallery"
        data-columns={block.columns || undefined}
      >
        {block.items.map((item, i) => (
          <figure key={i} className="detail-gallery-item">
            {renderMedia(item, width)}
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    );
  }

  if (block.type === "image" || block.type === "photo") {
    return (
      <figure key={index} className="detail-block detail-block--media">
        <img src={optimizeImage(block.src, FULL_WIDTH)} alt={block.caption || ""} />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === "video") {
    return (
      <figure key={index} className="detail-block detail-block--media">
        <video src={block.src} autoPlay muted loop playsInline />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === "youtube") {
    return (
      <figure key={index} className="detail-block detail-block--media">
        <iframe
          src={`https://www.youtube.com/embed/${block.src}`}
          title={block.caption || "Video"}
          allowFullScreen
        />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  return null;
}
