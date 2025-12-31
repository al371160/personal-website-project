import GalleryCard from "../components/GalleryCard";
import LinkList from "../components/LinkList";

const items = [
  {
    id: "01",
    title: "Study 01",
    image: "https://images.unsplash.com/photo-1520975922284-8b456906c813",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
{
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "02",
    title: "Study 02",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  
];

export default function Home() {
  return (
    <main className="page">
      {/* Top column / About section */}
      {/*<section className="top-column">
        <h2>About</h2>
        <p>
          Hi! I’m Alexander, a designer & developer exploring galleries,
          experiments, and 3D visual studies.
        </p>
      </section>
      */}

      {/* Bio + Links section */}
      <section className="bio-links-section">
        <div className="bio-column">
          <h3>Bio</h3>
          <p>
            I’m a student at Penn studying Digital Media Design (DMD). I
            explore visual design, interactive web experiences, and
            experimental galleries. My work ranges from CAD models to
            digital art.
          </p>
        </div>
        <div className="links-column">
          <LinkList
            title="Links"
            links={[
              { label: "Instagram", href: "https://instagram.com" },
              { label: "GitHub", href: "https://github.com" },
              { label: "Portfolio", href: "https://al371160.github.io" },
            ]}
          />
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery">
        {items.map((item) => (
          <GalleryCard key={item.id} {...item} />
        ))}
      </section>
    </main>
  );
}
