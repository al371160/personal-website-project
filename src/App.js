import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";

import TopBar from "./components/TopBar";
import Cursor from "./components/Cursor";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Hobbies from "./pages/Hobbies";
import Playground from "./pages/Playground";
import "./App.css";

function PageLoader({ isLoading, progress }) {
  return (
    <div className={`loader${isLoading ? " loader-visible" : ""}`}>
      <div className="loader-content">
        <span className="loader-percent">{progress}%</span>
        <div className="loader-bar-track">
          <div className="loader-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    window.__lenis = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      window.__lenis = null;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setProgress(0);
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [location.pathname]);

  useEffect(() => {
    if (!loading) lenisRef.current?.resize();
  }, [loading]);

  // Stable callback — prevents Home/Detail effects from re-running on every progress update
  const handleReady = useCallback(() => setLoading(false), []);

  return (
    <>
      <Cursor />
      <PageLoader isLoading={loading} progress={progress} />

      <div className={`app ${loading ? "app-loading" : "app-ready"}`}>
        <TopBar />

        <Routes>
          <Route
            path="/"
            element={<Home onReady={handleReady} onProgress={setProgress} />}
          />
          <Route
            path="/work/:slug"
            element={<Detail onReady={handleReady} onProgress={setProgress} />}
          />
          <Route
            path="/playground"
            element={<Playground onReady={handleReady} onProgress={setProgress} />}
          />
          <Route
            path="/about"
            element={<Hobbies onReady={handleReady} onProgress={setProgress} />}
          />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
