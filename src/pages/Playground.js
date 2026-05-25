import { useEffect } from "react";

export default function Playground({ onReady, onProgress }) {
  useEffect(() => {
    onProgress?.(100);
    onReady?.();
  }, [onReady, onProgress]);

  return (
    <main className="page">
      <div className="subpage-header">
        <h3>COMING SOON</h3>
        <h1>Playground</h1>
      </div>
      <p className="subpage-empty">Under construction.</p>
    </main>
  );
}
