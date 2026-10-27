import ProjectGallery from "../components/ProjectGallery";
import { homeProjects } from "../data/projects";
import { useEffect, useRef } from "react";
import { waitForMedia } from "../utils/waitForMedia";

const LINKS = [
  { label: "GitHub", href: "https://github.com/al371160" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/alexander-liu-282739206/" },
  { label: "Resume", href: "https://drive.google.com/file/d/1qvzjvyCNFUYIFTxiBk1JDlgEpBxXouGc/view?usp=sharing" },
  { label: "Email", href: "mailto:aliu10@seas.upenn.edu" },
];

export default function Home({ onReady, onProgress }) {
  const pageRef = useRef(null);

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
  }, [onReady, onProgress]);

  return (
    <main className="page" ref={pageRef}>
      <section className="home-intro">
        <div className="intro-col intro-col--main">
          <p className="intro-copy">
            I'm studying Computer Graphics and Computer Science at the University of
            Pennsylvania, building work at the intersection of design, technology,
            and engineering.
          </p>

          <div className="intro-links">
            <ul className="intro-list">
              {LINKS.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="archive-section" id="gallery-section">
        <ProjectGallery projects={homeProjects()} />
      </section>
    </main>
  );
}
