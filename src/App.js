import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Artwork from "./pages/Artwork";
import Hobbies from "./pages/Hobbies";
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
  }, [location.pathname]);

  return (
    <>
      <PageLoader isLoading={loading} progress={progress} />

      <div className={`app ${loading ? "app-loading" : "app-ready"}`}>
        <TopBar />

        <Routes>
          <Route
            path="/"
            element={<Home onReady={() => setLoading(false)} onProgress={setProgress} />}
          />
          <Route
            path="/work/:slug"
            element={<Detail onReady={() => setLoading(false)} onProgress={setProgress} />}
          />
          <Route
            path="/artwork"
            element={<Artwork onReady={() => setLoading(false)} onProgress={setProgress} />}
          />
          <Route
            path="/hobbies"
            element={<Hobbies onReady={() => setLoading(false)} onProgress={setProgress} />}
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
