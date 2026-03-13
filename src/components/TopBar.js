import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">
          Alexander Liu
        </Link>

        <div className="topbar-nav">
          <div className="emoji-nav-wrapper">
            <div className="emoji-sidebar">
              <Link to="/artwork" className="sidebar-item">artwork</Link>
              <Link to="/hobbies" className="sidebar-item">hobbies</Link>
            </div>
            <span className="emoji-link">٩(˶^ᗜ^˵)و</span>
          </div>
        </div>
      </div>
    </header>
  );
}
