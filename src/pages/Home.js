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
];

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Gallery</h1>
        <p>A collection of visual studies and experiments.</p>
      </section>

      <section className="gallery">
        {items.map((item) => (
          <GalleryCard key={item.id} {...item} />
        ))}
      </section>

      <LinkList
        title="Links"
        links={[
          { label: "Instagram", href: "https://instagram.com" },
          { label: "GitHub", href: "https://github.com" },
        ]}
      />
    </main>
  );
}
