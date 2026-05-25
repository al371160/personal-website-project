import { useEffect } from "react";

export default function Hobbies({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <main className="page">
      <div className="subpage-header">
        <h3>ABOUT</h3>
        <h1>About</h1>
      </div>

      <section className="gallery">
        {/* Add hobbies GalleryCard items here */}
      </section>

      <p className="subpage-empty">no pieces yet — check back soon. update testing</p>
    </main>
  );
}
