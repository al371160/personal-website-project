import { useParams } from "react-router-dom";
import { projects } from "../data/projects";
import DetailContentBlock from "../components/DetailContentBlock";
import VideoPlayer from "../components/VideoPlayer";
import { useEffect, useRef } from "react";
import { waitForMedia } from "../utils/waitForMedia";

const VIDEO_WIDTH = 2000;

function HeroMedia({ media, title }) {
  if (media.type === "video") {
    return <VideoPlayer src={media.src} width={VIDEO_WIDTH} title={title} />;
  }
  if (media.type === "youtube") {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${media.src}`}
        title={title}
        allowFullScreen
      />
    );
  }
  return <img src={media.src} alt={title} />;
}

function toParagraphs(body) {
  return Array.isArray(body)
    ? body
    : String(body ?? "").split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

// Folds the intro into the Overview text block as its first paragraph when there is one.
function mergeIntoOverview(content, intro) {
  const index = content.findIndex(
    (block) => block.type === "text" && block.title?.trim().toLowerCase() === "overview"
  );
  if (!intro || index === -1) return { content, merged: false };

  const merged = [...content];
  merged[index] = { ...content[index], body: [intro, ...toParagraphs(content[index].body)] };
  return { content: merged, merged: true };
}

export default function Detail({ onReady, onProgress }) {
  const { slug } = useParams();
  const project = projects.find(p => p.slug === slug);
  const pageRef = useRef(null);

  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    const container = pageRef.current;
    if (!container) { onProgress?.(100); onReady?.(); return; }

    const hero = container.querySelector(".detail-hero") || container;
    waitForMedia(hero, (p) => { if (!cancelled) onProgress?.(p); })
      .then(() => { if (!cancelled) onReady?.(); });

    const timeout = setTimeout(() => {
      if (!cancelled) { onProgress?.(100); onReady?.(); }
    }, 15000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [project, onReady, onProgress]);


  if (!project) {
    return <p>Project not found.</p>;
  }

  const intro = project.meta.roleDescription || project.description;
  const { content, merged: introInOverview } = mergeIntoOverview(project.content, intro);
  const links = project.links || (project.visitUrl ? [{ url: project.visitUrl }] : []);

  return (
    <main className="detail-page" ref={pageRef}>

      <section className="detail-hero">
        <HeroMedia media={project.hero} title={project.title} />
      </section>

      <div className="detail-layout">
        <aside className="detail-sidebar">
          <h1>{project.title}</h1>
          {links.length > 0 && (
            <div className="detail-links">
              {links.map((link) => (
                <a
                  key={link.url}
                  className="detail-visit-btn"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label || "Visit project"}
                  <span className="detail-visit-btn-icon" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
        </aside>

        <div className="detail-content">
          <section className="detail-header-main">
            <div className="detail-meta">
              <div className="meta-box">
                <h3>Role</h3>
                <p>{project.meta.role}</p>
              </div>
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

            {intro && !introInOverview && <p className="detail-intro">{intro}</p>}
          </section>

          {project.heroVideo && (
            <figure className="detail-block detail-block--media">
              <HeroMedia media={project.heroVideo} title={`${project.title} video`} />
            </figure>
          )}

          <div className="detail-blocks">
            {content.map((block, i) => (
              <DetailContentBlock key={i} block={block} index={i} />
            ))}
          </div>
        </div>
      </div>

    </main>
  );
}
