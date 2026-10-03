import { lazy, Suspense } from "react";
import { optimizeImage } from "../utils/cloudinary";
import VideoPlayer from "./VideoPlayer";
import YouTubePlaylist from "./YouTubePlaylist";

// Content column is ~1000px wide; 2x covers retina. Multi-column galleries
// collapse to one column on phones, so they still need ~1200px.
const FULL_WIDTH = 2000;
const GALLERY_TILE_WIDTH = 1200;

// Lucide's name lookup table is large, so only pages with a callout download it.
const DynamicIcon = lazy(() =>
  import("lucide-react/dynamic").then((m) => ({ default: m.DynamicIcon }))
);

function renderMedia(item, width) {
  if (item.type === "video") {
    return <VideoPlayer src={item.src} width={width} title={item.caption} />;
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
      <section
        key={index}
        className={`detail-text-block${block.body ? "" : " detail-text-block--heading"}`}
      >
        {block.title && <h2 className="detail-text-title">{block.title}</h2>}
        {block.body && <TextBody body={block.body} />}
      </section>
    );
  }

  if (block.type === "callout") {
    const items = block.items || [block];
    return (
      <div
        key={index}
        className="detail-callouts"
        data-columns={block.columns || undefined}
      >
        {items.map((item, i) => (
          <aside key={i} className="detail-callout">
            {item.icon && (
              <span className="detail-callout-icon" aria-hidden="true">
                <Suspense fallback={null}>
                  <DynamicIcon name={item.icon} size={28} strokeWidth={1.75} />
                </Suspense>
              </span>
            )}
            <div className="detail-callout-text">
              {item.title && <h3 className="detail-callout-title">{item.title}</h3>}
              {item.body && <TextBody body={item.body} />}
            </div>
          </aside>
        ))}
      </div>
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
        <VideoPlayer src={block.src} width={FULL_WIDTH} title={block.caption} />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === "youtube") {
    if (block.videos?.length) {
      return <YouTubePlaylist videos={block.videos} caption={block.caption} />;
    }
    return (
      <figure key={index} className="detail-block detail-block--media">
        <iframe
          src={`https://www.youtube.com/embed/${block.src}`}
          title={block.caption || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  return null;
}
