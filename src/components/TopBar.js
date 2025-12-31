import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">
          Alexander Liu
        </Link>

        <div className="topbar-nav">
          <Link to="/">Work</Link>
          {/*<a href="https://yourlink.com" target="_blank" rel="noreferrer">
            About
          </a>*/}
          <Link to="/">About</Link>
        </div>
      </div>
    </header>
  );
}
