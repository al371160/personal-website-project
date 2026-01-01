import { useParams } from "react-router-dom";
import { projects } from "../data/projects";

export default function Detail() {
  const { slug } = useParams();
  const project = projects.find(p => p.slug === slug);

  if (!project) return <p>Project not found.</p>;

  return (
    <main className="detail-page">

      {/* HERO */}
      <section className="detail-hero">
        {project.hero.type === "image" && (
          <img src={project.hero.src} alt={project.title} />
        )}
        {project.hero.type === "video" && (
          <video src={project.hero.src} autoPlay muted loop playsInline />
        )}
      </section>

      {/* TITLE */}
      <section className="detail-header">
        <h1>{project.title}</h1>
        <p className="detail-subtitle">{project.description}</p>
      </section>

      {/* META INFO (like LinkList, but text) */}
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

      {/* CONTENT BLOCKS */}
      <section className="detail-content">
        {project.content.map((block, i) => (
          <figure key={i} className="detail-block">
            {block.type === "image" && (
              <img src={block.src} alt={block.caption || ""} />
            )}
            {block.type === "video" && (
              <video src={block.src} controls />
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
