import GalleryCard from "../components/GalleryCard";
import { projects } from "../data/projects";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "GitHub", href: "https://github.com/al371160" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/alexander-liu-282739206/" },
  { label: "Resume", href: "https://drive.google.com/file/d/1qvzjvyCNFUYIFTxiBk1JDlgEpBxXouGc/view?usp=sharing" },
  { label: "Email", href: "mailto:aliu10@seas.upenn.edu" },
];

// The 900px breakpoint must match the .intro-col--main media query in App.css.
const COLUMN_QUERIES = [
  { query: "(max-width: 560px)", columns: 1 },
  { query: "(max-width: 900px)", columns: 2 },
];

function getColumnCount() {
  const match = COLUMN_QUERIES.find(({ query }) => window.matchMedia(query).matches);
  return match ? match.columns : 3;
}

function useColumnCount() {
  const [count, setCount] = useState(getColumnCount);

  useEffect(() => {
    const lists = COLUMN_QUERIES.map(({ query }) => window.matchMedia(query));
    const update = () => setCount(getColumnCount());
    lists.forEach((mql) => mql.addEventListener("change", update));
    return () => lists.forEach((mql) => mql.removeEventListener("change", update));
  }, []);

  return count;
}

export default function Home({ onReady, onProgress }) {
  const pageRef = useRef(null);
  const columnCount = useColumnCount();

  // Round-robin so cards read left-to-right, then down, while each column stacks tightly.
  const columns = Array.from({ length: columnCount }, () => []);
  projects.forEach((project, i) => columns[i % columnCount].push({ project, i }));

  useEffect(() => {
    let cancelled = false;
    const container = pageRef.current;
    if (!container) { onProgress?.(100); onReady?.(); return; }

    const imgs   = [...container.querySelectorAll("img")];
    const videos = [...container.querySelectorAll("video")];
    const total  = imgs.length + videos.length;
    if (total === 0) { onProgress?.(100); onReady?.(); return; }

    let completed = 0;
    const done = () => {
      if (cancelled) return;
      completed++;
      onProgress?.(Math.round((completed / total) * 100));
      if (completed >= total) onReady?.();
    };

    // Wait for decode too, so images are paintable when the loader lifts.
    const settle = (img) =>
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(done);

    imgs.forEach(img => {
      if (img.complete) { settle(img); return; }
      img.addEventListener("load",  () => settle(img), { once: true });
      img.addEventListener("error", done, { once: true });
    });
    videos.forEach(v => {
      if (v.readyState >= 2) { done(); return; }
      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("error",      done, { once: true });
    });

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
        <div
          className="gallery"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {columns.map((column, c) => (
            <div className="gallery-column" key={c}>
              {column.map(({ project, i }) => (
                <GalleryCard
                  key={project.slug}
                  slug={project.slug}
                  title={project.title}
                  hero={project.thumbnail}
                  featured={i === 0}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
