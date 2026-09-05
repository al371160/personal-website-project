import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">Alexander Liu</Link>

        <nav className="topbar-nav">
          <Link to="/playground" className="topbar-link">Playground</Link>
        </nav>
      </div>
    </header>
  );
}
