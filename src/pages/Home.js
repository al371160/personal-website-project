import GalleryCard from "../components/GalleryCard";
import LinkList from "../components/LinkList";


const items = [
  {
    id: "01",
    title: "Orble Tea",
    description: "Comprehensive branding and business work",
    video: "https://orble-tea.com/media/next-gen-render-video.mp4",
  },
  {
    id: "02",
    title: "REV 11",
    description: "Sponsorship development and competition materials",
    image: "https://static1.squarespace.com/static/576dc266e6f2e1d283993688/t/5c8d5c5de2c4837a233f6da7/1552768100511/Car+Trophies+Twilight.jpg?format=1500w",
  },
  {
    id: "03",
    title: "Rum Rush",
    description: "Indie game project leader",
    image: "https://img.itch.zone/aW1nLzIzOTg4MzY2LnBuZw==/original/nTUef5.png",
  },
  {
    id: "04",
    title: "LatticeCore",
    description: "Startup competitor",
    image: "https://i.ytimg.com/vi/B-3ZW0gxFVI/maxresdefault.jpg",
  },
  {
    id: "05",
    title: "PawFond",
    description: "Brand Design and Web Development",
    image: "https://mypawfond.com/cdn/shop/files/pawfond_main_28440bdd-a4f0-4c88-881c-75bba76e281c_2048x2048.png?v=1762849564",
  },
  {
    id: "06",
    title: "Saturn",
    description: "Solo indie graphics experiment",
    image: "https://img.itch.zone/aW1nLzIxNTIyNTc3LnBuZw==/315x250%23c/dyQZfc.png",
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
        {items.map((item) => (
          <GalleryCard key={item.id} {...item} />
        ))}
      </section>
    </main>
  );
}
