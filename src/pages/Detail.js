import { useParams } from "react-router-dom";
import { projects } from "../data/projects";
import { useEffect, useRef } from "react";

export default function Detail({ onReady, onProgress }) {
  const { slug } = useParams();
  const project = projects.find(p => p.slug === slug);
  const pageRef = useRef(null);

  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    const container = pageRef.current;
    if (!container) { onProgress?.(100); onReady?.(); return; }

    const imgs = [...container.querySelectorAll("img")];
    const videos = [...container.querySelectorAll("video")];
    const total = imgs.length + videos.length;
    if (total === 0) { onProgress?.(100); onReady?.(); return; }

    let completed = 0;
    const done = () => {
      if (cancelled) return;
      completed++;
      onProgress?.(Math.round((completed / total) * 100));
      if (completed >= total) onReady?.();
    };

    imgs.forEach(img => {
      if (img.complete) { done(); return; }
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });

    videos.forEach(v => {
      if (v.readyState >= 2) { done(); return; }
      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("error", done, { once: true });
    });

    const timeout = setTimeout(() => {
      if (!cancelled) { onProgress?.(100); onReady?.(); }
    }, 15000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [project, onReady, onProgress]);


  if (!project) {
    return <p>Project not found.</p>;
  }

  return (
    <main className="detail-page" ref={pageRef}>

      {/* HERO */}
      <section className="detail-hero">
        {project.hero.type === "image" && (
          <img src={project.hero.src} alt={project.title} />
        )}

        {project.hero.type === "video" && (
          <video src={project.hero.src} autoPlay muted loop playsInline />
        )}

        {project.hero.type === "youtube" && (
          <iframe
            src={`https://www.youtube.com/embed/${project.hero.src}`}
            title={project.title}
            allowFullScreen
          />
        )}
      </section>

      {/* TWO-COLUMN LAYOUT */}
      <div className="detail-layout">

        {/* LEFT: scrolling content */}
        <section className="detail-content">
          <div className="detail-meta">
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
          </div>

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

        {/* LEFT: sticky sidebar — title + headline */}
        <aside className="detail-sidebar">
          <h1>{project.title}</h1>
          <p className="detail-subtitle">{project.description}</p>
        </aside>

      </div>

    </main>
  );
}
