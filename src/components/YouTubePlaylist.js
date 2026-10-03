import { useState } from "react";

export default function YouTubePlaylist({ videos, caption }) {
  const [active, setActive] = useState(0);
  const current = videos[active];

  return (
    <figure className="detail-block detail-block--media detail-block--playlist">
      <iframe
        key={current.id}
        src={`https://www.youtube.com/embed/${current.id}`}
        title={current.title || caption || "Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <div className="youtube-playlist-rail" role="list">
        {videos.map((video, i) => (
          <button
            key={video.id}
            type="button"
            role="listitem"
            className={`youtube-playlist-item${i === active ? " is-active" : ""}`}
            onClick={() => setActive(i)}
            aria-current={i === active ? "true" : undefined}
          >
            <span className="youtube-playlist-index">{i + 1}</span>
            <span className="youtube-playlist-name">
              {video.title.replace(/^\d+\.\s*/, "")}
            </span>
          </button>
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
