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
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(0);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Stable callback — prevents Home/Detail effects from re-running on every progress update
  const handleReady = useCallback(() => setLoading(false), []);

  return (
    <>
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
