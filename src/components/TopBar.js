import { Link, useLocation } from "react-router-dom";

export default function TopBar() {
  const location = useLocation();

  function handleWorkClick(e) {
    if (location.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById("gallery-section");
      if (!el) return;
      if (window.__lenis) {
        window.__lenis.scrollTo(el);
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">Alexander Liu</Link>

        <nav className="topbar-nav">
          <Link to="/" className="topbar-link" onClick={handleWorkClick}>work</Link>
          <Link to="/playground" className="topbar-link">playground</Link>
          <Link to="/about" className="topbar-link">about</Link>
        </nav>
      </div>
    </header>
  );
}
