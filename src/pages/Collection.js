import { useEffect, useRef } from "react";
import ProjectGallery from "../components/ProjectGallery";
import { COLLECTIONS, collectionProjects } from "../data/projects";
import { waitForMedia } from "../utils/waitForMedia";

export default function Collection({ name, onReady, onProgress }) {
  const pageRef = useRef(null);
  const collection = COLLECTIONS[name];
  const projects = collectionProjects(name);

  useEffect(() => {
    let cancelled = false;
    const container = pageRef.current;
    if (!container) { onProgress?.(100); onReady?.(); return; }

    waitForMedia(container, (p) => { if (!cancelled) onProgress?.(p); })
      .then(() => { if (!cancelled) onReady?.(); });

    const timeout = setTimeout(() => {
      if (!cancelled) { onProgress?.(100); onReady?.(); }
    }, 15000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [name, onReady, onProgress]);

  if (!collection) {
    return <p>Collection not found.</p>;
  }

  const links = collection.links || [];

  return (
    <main className="page" ref={pageRef}>
      {(collection.intro || links.length > 0) && (
        <section className="home-intro">
          <div className="intro-col intro-col--main">
            {collection.intro && <p className="intro-copy">{collection.intro}</p>}

            {links.length > 0 && (
              <div className="intro-links">
                <ul className="intro-list">
                  {links.map((item) => (
                    <li key={item.label}>
                      <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="archive-section">
        <ProjectGallery projects={projects} />
      </section>
    </main>
  );
}
