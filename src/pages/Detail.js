import { useParams } from "react-router-dom";
import { projects } from "../data/projects";
import DetailContentBlock from "../components/DetailContentBlock";
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

      <div className="detail-layout">

        <aside className="detail-sidebar">
          <div className="detail-sidebar-intro">
            <h1>{project.title}</h1>
            {project.description && (
              <p className="detail-tagline">{project.description}</p>
            )}
          </div>
          {project.visitUrl && (
            <a
              className="detail-visit-btn"
              href={project.visitUrl}
              target="_blank"
              rel="noreferrer"
            >
              Visit project
              <span className="detail-visit-btn-icon" aria-hidden="true">↗</span>
            </a>
          )}
        </aside>

        <section className="detail-content">
          <div className="detail-meta">
            <div className="meta-box">
              <h3>Collaborators</h3>
              <p>{project.meta.collaborators}</p>
            </div>
            <div className="meta-box">
              <h3>Duration</h3>
              <p>{project.meta.duration}</p>
            </div>
            <div className="meta-box">
              <h3>Tools</h3>
              <p>{project.meta.tools}</p>
            </div>
          </div>

          <div className="detail-blocks">
            {project.content.map((block, i) => (
              <DetailContentBlock key={i} block={block} index={i} />
            ))}
          </div>
        </section>

      </div>

    </main>
  );
}
