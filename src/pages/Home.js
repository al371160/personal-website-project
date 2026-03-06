import GalleryCard from "../components/GalleryCard";
import LinkList from "../components/LinkList";
import { projects } from "../data/projects";
import { useEffect, useRef } from "react";

export default function Home({ onReady, onProgress }) {
  const pageRef = useRef(null);

  useEffect(() => {
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

    return () => { cancelled = true; };
  }, [onReady, onProgress]);

  return (
    <main className="page" ref={pageRef}>
      {/* Bio + Links section */}
      <section className="bio-links-section">
        <div className="bio-column">
          <h3>BIO</h3>
          <p>
            I’m a student at Penn studying Digital Media Design (DMD). I
            explore visual design, interactive web experiences, and
            experimental galleries. My work ranges from CAD models to
            digital art.
          </p>
        </div>

        <div className="links-column">
          <LinkList
            title="TEAMS"
            links={[
              { label: "Penn Electric Racing", href: "https://www.pennelectricracing.com/" },
              { label: "Orble Tea", href: "https://orble-tea.com/" },
              { label: "Penn UPGRADE", href: "https://pennupgrade.com/" },
              { label: "PawFond", href: "https://mypawfond.com/" },
            ]}
          />
        </div>

        <div className="links-column">
          <LinkList
            title="LINKS"
            links={[
              { label: "Instagram", href: "https://instagram.com/al371160" },
              { label: "GitHub", href: "https://github.com/al371160" },
              { label: "Itch", href: "https://al371160.itch.io" },
            ]}
          />
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery">
        {projects.map((project) => (
            <GalleryCard
            key={project.slug}
            slug={project.slug}
            title={project.title}
            description={project.description}
            hero={project.thumbnail} // use thumbnail for home page
            />
        ))}
      </section>


    </main>
  );
}
