import { useParams } from "react-router-dom";
import { projects } from "../data/projects";
import { useEffect } from "react";

const VIDEO_EXT = /\.(mp4|webm|mov|ogg|ogv)(\?.*)?$/i;
const isVideo = m => m.type === "video" || VIDEO_EXT.test(m.src ?? "");

export default function Detail({ onReady, onProgress }) {
  const { slug } = useParams();
  const project = projects.find(p => p.slug === slug);

  useEffect(() => {
    if (!project) return;

    const mediaItems = [project.hero, ...project.content]
      .filter(m => m && m.src);

    if (mediaItems.length === 0) { onProgress?.(100); onReady?.(); return; }

    let completed = 0;
    const done = () => {
      completed++;
      onProgress?.(Math.round((completed / mediaItems.length) * 100));
      if (completed >= mediaItems.length) onReady?.();
    };

    mediaItems.forEach(m => {
      if (isVideo(m)) {
        const v = document.createElement("video");
        v.preload = "auto";
        v.onloadeddata = done;
        v.onerror = done;
        v.src = m.src;
        v.load();
      } else {
        const img = new Image();
        img.onload = done;
        img.onerror = done;
        img.src = m.src;
      }
    });
  }, [project, onReady, onProgress]);


  if (!project) {
    return <p>Project not found.</p>;
  }

  return (
    <main className="detail-page">

      {/* HERO */}
      <section className="detail-hero">
        {project.hero.type === "image" && (
          <img src={project.hero.src} alt={project.title} />
        )}

        {project.hero.type === "video" && (
          <video
            src={project.hero.src}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
      </section>

      {/* TITLE */}
      <section className="detail-header">
        <h1>{project.title}</h1>
        <p className="detail-subtitle">{project.description}</p>
      </section>

      {/* META */}
      <section className="detail-meta">
        <div className="meta-box">
          <h3>ROLE</h3>
          <p>{project.meta.role}</p>
        </div>
        <div className="meta-box">
          <h3>COLLABORATORS</h3>
          <p>{project.meta.collaborators}</p>
        </div>
        <div className="meta-box">
          <h3>DURATION</h3>
          <p>{project.meta.duration}</p>
        </div>
        <div className="meta-box">
          <h3>TOOLS</h3>
          <p>{project.meta.tools}</p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="detail-content">
        {project.content.map((block, i) => (
          <figure key={i} className="detail-block">
            {block.type === "image" && (
              <img src={block.src} alt={block.caption || ""} />
            )}

            {block.type === "video" && (
              <video
                src={block.src}
                autoPlay
                muted
                loop
                playsInline
              />
            )}

            {block.caption && (
              <figcaption>{block.caption}</figcaption>
            )}
          </figure>
        ))}
      </section>

    </main>
  );
}
