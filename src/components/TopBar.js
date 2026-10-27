import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Design", to: "/design" },
  { label: "Graphics", to: "/graphics" },
];

export default function TopBar() {
  const { pathname } = useLocation();
  const onPlayground = pathname.startsWith("/playground");
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const handlePointer = (event) => {
      if (barRef.current && !barRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [menuOpen]);

  const isActive = (to) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <header className="topbar">
      <div className="topbar-inner" ref={barRef}>
        <Link to="/" className="topbar-logo">Alexander Liu</Link>

        <button
          type="button"
          className="topbar-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="topbar-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav
          id="topbar-nav"
          className={`topbar-nav${menuOpen ? " topbar-nav--open" : ""}`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`topbar-link${isActive(link.to) ? " topbar-link--active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={onPlayground ? "/" : "/playground"}
            className={`topbar-link${onPlayground ? " topbar-link--active" : ""}`}
          >
            {onPlayground ? "Back" : "More Work"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
