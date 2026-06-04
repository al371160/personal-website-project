function renderMedia(item) {
  if (item.type === "video") {
    return (
      <video src={item.src} autoPlay muted loop playsInline />
    );
  }
  return <img src={item.src} alt={item.caption || ""} />;
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
    return (
      <div
        key={index}
        className="detail-gallery"
        data-columns={block.columns || undefined}
      >
        {block.items.map((item, i) => (
          <figure key={i} className="detail-gallery-item">
            {renderMedia(item)}
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
        ))}
      </div>
    );
  }

  if (block.type === "image" || block.type === "photo") {
    return (
      <figure key={index} className="detail-block detail-block--media">
        <img src={block.src} alt={block.caption || ""} />
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

  return null;
}
