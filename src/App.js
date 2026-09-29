import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

import TopBar from "./components/TopBar";
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
  // Readiness is tracked per visit, not per history entry: going back to a
  // previously-ready entry remounts the page, so it has to load again.
  const [visit, setVisit] = useState({ key: location.key, ready: false, progress: 0 });
  if (visit.key !== location.key) {
    setVisit({ key: location.key, ready: false, progress: 0 });
  }

  const current = visit.key === location.key;
  const ready = current && visit.ready;
  const progress = current ? visit.progress : 0;

  // Callbacks are bound to the visit's key so a stale page can't mark a newer visit ready.
  const handleReady = useCallback(() => {
    setVisit((prev) =>
      prev.key !== location.key || prev.ready ? prev : { ...prev, ready: true }
    );
  }, [location.key]);

  const handleProgress = useCallback(
    (p) => {
      setVisit((prev) =>
        prev.key !== location.key || prev.progress === p ? prev : { ...prev, progress: p }
      );
    },
    [location.key]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <PageLoader isLoading={!ready} progress={progress} />

      <TopBar />

      <div className={`app ${ready ? "app-ready" : "app-loading"}`}>
        <Routes>
          <Route
            path="/"
            element={<Home onReady={handleReady} onProgress={handleProgress} />}
          />
          <Route
            path="/work/:slug"
            element={<Detail onReady={handleReady} onProgress={handleProgress} />}
          />
          <Route
            path="/playground"
            element={<Playground onReady={handleReady} onProgress={handleProgress} />}
          />
          <Route
            path="/about"
            element={<Hobbies onReady={handleReady} onProgress={handleProgress} />}
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