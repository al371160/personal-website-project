import { useCallback, useEffect, useRef } from "react";
import PoolScene from "../components/pool/PoolScene";

export default function Home({ onReady, onProgress }) {
  const done = useRef(false);
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onProgress?.(100);
    onReady?.();
  }, [onReady, onProgress]);

  // never hold the loader hostage if WebGL is slow or unavailable
  useEffect(() => {
    const timeout = setTimeout(finish, 8000);
    return () => clearTimeout(timeout);
  }, [finish]);

  return (
    <main className="page page-pool">
      <section className="pool-bio">
        <p className="intro-copy">
          I'm studying Computer Graphics and Computer Science at the University of Pennsylvania,
          building work at the intersection of design, technology, and engineering.
        </p>
      </section>
      <PoolScene onFirstFrame={finish} />
    </main>
  );
}
