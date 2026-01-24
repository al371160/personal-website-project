import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import TopBar from "./components/TopBar";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import "./App.css";

function PageLoader({ isLoading }) {
  return (
    <div className={`loader ${!isLoading ? "loader-exit" : ""}`}>
      <svg className="loader-mark" width="80" height="80">
        {/* logo / animation */}
      </svg>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // shorter feels snappier on navigation

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <PageLoader isLoading={loading} />
      <div className={`app ${loading ? "app-loading" : "app-ready"}`}>
        <TopBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/:slug" element={<Detail />} />
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
