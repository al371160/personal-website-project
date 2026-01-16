import { Link } from "react-router-dom";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">
          Alexander Liu
        </Link>

        <div className="topbar-nav">
          {/*<Link to="/">٩(˶^ᗜ^˵)و</Link> */}
          <a href="https://www.youtube.com/watch?v=mgQL2xeviN8&list=RDmgQL2xeviN8&start_radio=1" target="_blank" rel="noreferrer">
            ٩(˶^ᗜ^˵)و
          </a>
        </div>
      </div>
    </header>
  );
}
