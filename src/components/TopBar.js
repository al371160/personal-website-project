import { Link, useLocation } from "react-router-dom";

export default function TopBar() {
  const { pathname } = useLocation();
  const onPlayground = pathname.startsWith("/playground");

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-logo">Alexander Liu</Link>

        <nav className="topbar-nav">
          <Link
            to={onPlayground ? "/" : "/playground"}
            className={`topbar-more${onPlayground ? " topbar-more--home" : ""}`}
            aria-label={onPlayground ? "Back" : "More work"}
          >
            {onPlayground ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 11.5 12 4l8 7.5" />
                <path d="M6.5 10.5V20h11V10.5" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="topbar-iridescent"
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0" stopColor="#67e8f9" />
                    <stop offset="0.25" stopColor="#60a5fa" />
                    <stop offset="0.5" stopColor="#818cf8" />
                    <stop offset="0.75" stopColor="#c4b5fd" />
                    <stop offset="1" stopColor="#5eead4" />
                    <animateTransform
                      attributeName="gradientTransform"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </linearGradient>
                </defs>
                <g className="topbar-more-canvas">
                  <rect x="4" y="3" width="16" height="12" />
                  <path d="M8 15l-2 6M16 15l2 6M12 15v3" />
                </g>
                <g className="topbar-more-arrow">
                  <path d="M4 12h16" pathLength="1" />
                  <path d="M14 6l6 6-6 6" pathLength="1" />
                </g>
              </svg>
            )}
            <span className="topbar-more-label">
              <span>{onPlayground ? "Back" : "More Work"}</span>
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
