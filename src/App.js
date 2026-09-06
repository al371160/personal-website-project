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
  const [readyKeys, setReadyKeys] = useState(() => new Set());
  const [progressByKey, setProgressByKey] = useState({});

  const ready = readyKeys.has(location.key);
  const progress = progressByKey[location.key] ?? 0;

  // Records this route as ready once its page calls onReady.
  const handleReady = useCallback(() => {
    setReadyKeys((prev) => {
      if (prev.has(location.key)) return prev;
      const next = new Set(prev);
      next.add(location.key);
      return next;
    });
  }, [location.key]);

  const handleProgress = useCallback(
    (p) => {
      setProgressByKey((prev) =>
        prev[location.key] === p ? prev : { ...prev, [location.key]: p }
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

      <div className={`app ${ready ? "app-ready" : "app-loading"}`}>
        <TopBar />

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