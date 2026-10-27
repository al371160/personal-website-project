import { useEffect, useState } from "react";
import GalleryCard from "./GalleryCard";

// Desktop is two columns. The 560px breakpoint matches the single-column home layout.
const COLUMN_QUERIES = [
  { query: "(max-width: 560px)", columns: 1 },
];

function getColumnCount() {
  const match = COLUMN_QUERIES.find(({ query }) => window.matchMedia(query).matches);
  return match ? match.columns : 2;
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

export default function ProjectGallery({ projects }) {
  const columnCount = useColumnCount();

  // Round-robin so cards read left-to-right, then down, while each column stacks tightly.
  const columns = Array.from({ length: columnCount }, () => []);
  projects.forEach((project, i) => columns[i % columnCount].push({ project, i }));

  return (
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
              placeholder={project.placeholder}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
