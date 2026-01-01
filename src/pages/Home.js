import GalleryCard from "../components/GalleryCard";
import LinkList from "../components/LinkList";


const items = [
  {
    id: "01",
    title: "Orble Tea",
    description: "Comprehensive branding and business work",
    image: "https://images.unsplash.com/photo-1520975922284-8b456906c813",
  },
  {
    id: "02",
    title: "REV 11",
    description: "Sponsorship development and competition materials",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "03",
    title: "Rum Rush",
    description: "Indie game project leader",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    id: "04",
    title: "LatticeCore",
    description: "Startup competitor",
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
        {items.map((item) => (
          <GalleryCard key={item.id} {...item} />
        ))}
      </section>
    </main>
  );
}
