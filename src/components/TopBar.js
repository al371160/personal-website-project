import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">
          Alexander Liu
        </Link>

        <div className="topbar-nav">
          <div ref={wrapperRef} className={`emoji-nav-wrapper${open ? " open" : ""}`}>
            <div className="emoji-sidebar">
              <Link to="/artwork" className="sidebar-item" onClick={() => setOpen(false)}>artwork</Link>
              <Link to="/hobbies" className="sidebar-item" onClick={() => setOpen(false)}>hobbies</Link>
            </div>
            <span
              className="emoji-link"
              onClick={() => {
                if (window.matchMedia("(hover: none)").matches) setOpen((o) => !o);
              }}
            >
              ٩(˶^ᗜ^˵)و
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
