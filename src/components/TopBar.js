import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">
          Your Name
        </Link>

        <nav className="topbar-nav">
          <Link to="/">Work</Link>
          <a href="https://yourlink.com" target="_blank" rel="noreferrer">
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
