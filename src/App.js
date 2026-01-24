import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import "./App.css";

function PageLoader({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="loader">
      <svg className="loader-mark" width="80" height="80">
        <use href="https://res.cloudinary.com/dak0zi45d/image/upload/v1769273643/personal_website_loading_screen_v2_lyb0ah.svg" />
      </svg>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Show loader immediately on route change
  useEffect(() => {
    setLoading(true);
  }, [location.pathname]);

  return (
    <>
      <PageLoader isLoading={loading} />

      <div className={`app ${loading ? "app-loading" : "app-ready"}`}>
        <TopBar />

        <Routes>
          <Route
            path="/"
            element={<Home onReady={() => setLoading(false)} />}
          />
          <Route
            path="/work/:slug"
            element={<Detail onReady={() => setLoading(false)} />}
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
