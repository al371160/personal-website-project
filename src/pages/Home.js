import GalleryCard from "../components/GalleryCard";
import LinkList from "../components/LinkList";
import { projects } from "../data/projects";
import { useEffect } from "react";

const VIDEO_EXT = /\.(mp4|webm|mov|ogg|ogv)(\?.*)?$/i;
const isVideo = m => m.type === "video" || VIDEO_EXT.test(m.src ?? "");

function preloadMedia(items, onProgress, onAllDone) {
  const media = items.filter(m => m && m.src);
  if (media.length === 0) { onProgress(100); onAllDone(); return; }

  let completed = 0;
  const done = () => {
    completed++;
    onProgress(Math.round((completed / media.length) * 100));
    if (completed >= media.length) onAllDone();
  };

  media.forEach(m => {
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
}

export default function Home({ onReady, onProgress }) {
  useEffect(() => {
    preloadMedia(projects.map(p => p.thumbnail), onProgress ?? (() => {}), () => onReady?.());
  }, [onReady, onProgress]);

  return (
    <main className="page">
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
