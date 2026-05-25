import { useEffect, useRef, useState, useCallback } from "react";

// ─── note definitions ─────────────────────────────────────────────────────────
// px/py are % of container; w in px; rot in degrees
const NOTES_DEF = [
  { id: "bio",       bg: "#C0392B", textColor: "#fff",  rot: -4.0, px: 4,  py: 5,  w: 215, fold: false },
  { id: "links",     bg: "#1A4E5C", textColor: "#fff",  rot:  2.5, px: 53, py: 4,  w: 175, fold: false },
  { id: "theme",     bg: "#2C2C2C", textColor: "#fff",  rot: -1.8, px: 54, py: 54, w: 160, fold: true  },
  { id: "guestbook", bg: "#7B3F00", textColor: "#fff",  rot:  2.0, px: 3,  py: 53, w: 185, fold: true  },
];

// ─── theme hook ───────────────────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("koi-theme");
    return saved !== "light";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("koi-theme", isDark ? "dark" : "light");
  }, [isDark]);
  return [isDark, () => setIsDark(v => !v)];
}

// ─── guestbook hook ───────────────────────────────────────────────────────────
function useGuestbook() {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("guestbook") || "[]"); }
    catch { return []; }
  });
  const add = useCallback((name, msg) => {
    setEntries(prev => {
      const next = [{ name, msg, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }, ...prev].slice(0, 6);
      localStorage.setItem("guestbook", JSON.stringify(next));
      return next;
    });
  }, []);
  return [entries, add];
}

// ─── corner marks (like the reference) ───────────────────────────────────────
function CornerMarks({ color }) {
  const s = { position: "absolute", width: 7, height: 7, background: color };
  return (
    <>
      <div style={{ ...s, top: 10,  left: 10  }} />
      <div style={{ ...s, top: 10,  right: 10 }} />
      <div style={{ ...s, bottom: 10, left: 10  }} />
      <div style={{ ...s, bottom: 10, right: 10 }} />
    </>
  );
}

// ─── folded corner ────────────────────────────────────────────────────────────
function FoldedCorner({ bg }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, right: 0,
      width: 0, height: 0,
      borderStyle: "solid",
      borderWidth: "0 0 22px 22px",
      borderColor: `transparent transparent rgba(255,255,255,0.18) transparent`,
    }} />
  );
}

// ─── note contents ────────────────────────────────────────────────────────────

function BioNote({ color }) {
  return (
    <div style={{ padding: "22px 20px 26px", position: "relative" }}>
      <CornerMarks color="rgba(255,255,255,0.35)" />
      <p style={{ margin: "0 0 4px", fontFamily: "sans-serif", fontWeight: 800, fontSize: 17, color, lineHeight: 1.15 }}>
        alex liu
      </p>
      <p style={{ margin: "0 0 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color, opacity: 0.6, letterSpacing: "0.07em" }}>
        CS · PENN SEAS
      </p>
      <p style={{ margin: 0, fontFamily: "sans-serif", fontSize: 13, color, lineHeight: 1.6, opacity: 0.92 }}>
        I build things at the intersection of software and design — interfaces, tools, and experiences.
      </p>
    </div>
  );
}

function LinksNote({ color }) {
  const links = [
    { label: "github",   href: "https://github.com/al371160" },
    { label: "linkedin", href: "https://www.linkedin.com/in/alexander-liu-282739206/" },
    { label: "resume",   href: "/resume.pdf" },
    { label: "email",    href: "mailto:aliu10@seas.upenn.edu" },
  ];
  return (
    <div style={{ padding: "18px 18px 22px" }}>
      <p style={{ margin: "0 0 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, color, opacity: 0.55, letterSpacing: "0.10em" }}>
        LINKS ↗
      </p>
      {links.map(l => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            color, textDecoration: "none", opacity: 0.88,
            fontFamily: "sans-serif", fontSize: 13, fontWeight: 500,
            padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.12)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.88"}
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}

function ThemeNote({ color, isDark, toggle }) {
  return (
    <div style={{ padding: "16px 18px 20px" }}>
      <p style={{ margin: "0 0 12px", fontFamily: "'DM Mono', monospace", fontSize: 10, color, opacity: 0.5, letterSpacing: "0.10em" }}>
        APPEARANCE
      </p>
      <button
        onClick={e => { e.stopPropagation(); toggle(); }}
        onMouseDown={e => e.stopPropagation()}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
          background: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.22)",
          border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6,
          color, fontFamily: "sans-serif", fontSize: 13, fontWeight: 600,
          cursor: "pointer", width: "100%", justifyContent: "center",
          transition: "background 0.2s",
        }}
      >
        <span style={{ fontSize: 15 }}>{isDark ? "🌙" : "☀️"}</span>
        {isDark ? "dark mode" : "light mode"}
      </button>
      <FoldedCorner />
    </div>
  );
}

function GuestbookNote({ color, entries, onAdd }) {
  const [name, setName] = useState("");
  const [msg, setMsg]   = useState("");
  const submit = e => {
    e.preventDefault(); e.stopPropagation();
    if (!name.trim() || !msg.trim()) return;
    onAdd(name.trim(), msg.trim());
    setName(""); setMsg("");
  };
  return (
    <div style={{ padding: "16px 16px 20px", position: "relative" }}>
      <p style={{ margin: "0 0 10px", fontFamily: "'DM Mono', monospace", fontSize: 10, color, opacity: 0.5, letterSpacing: "0.10em" }}>
        GUESTBOOK ✍
      </p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="name"
          onMouseDown={e => e.stopPropagation()}
          style={iStyle(color)}
        />
        <textarea
          value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="leave a note"
          rows={2}
          onMouseDown={e => e.stopPropagation()}
          style={{ ...iStyle(color), resize: "none", fontFamily: "inherit" }}
        />
        <button type="submit" onMouseDown={e => e.stopPropagation()} style={btnStyle}>
          sign →
        </button>
      </form>
      {entries.slice(0, 2).map((e, i) => (
        <div key={i} style={{ marginTop: 7, fontSize: 10, color, opacity: 0.75, fontFamily: "'DM Mono', monospace" }}>
          <strong>{e.name}</strong> · {e.msg}
        </div>
      ))}
      <FoldedCorner />
    </div>
  );
}

const iStyle = (color) => ({
  width: "100%", background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.22)", borderRadius: 4,
  padding: "5px 8px", fontSize: 11, color,
  boxSizing: "border-box", outline: "none",
  fontFamily: "sans-serif",
  "::placeholder": { color: "rgba(255,255,255,0.4)" },
});

const btnStyle = {
  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 4, padding: "5px 10px", fontSize: 11, color: "#fff",
  cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em",
};

// ─── single draggable note ────────────────────────────────────────────────────
function Note({ data, onDragStart, isTop }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        position: "absolute",
        left: data.x, top: data.y,
        width: data.w,
        background: data.bg,
        borderRadius: 3,
        boxShadow: hovered || isTop
          ? "6px 10px 32px rgba(0,0,0,0.55)"
          : "4px 6px 18px rgba(0,0,0,0.40)",
        transform: `rotate(${data.rot + (hovered ? 2.5 : 0)}deg) scale(${hovered ? 1.03 : 1})`,
        transition: "transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s",
        cursor: "grab",
        userSelect: "none",
        zIndex: isTop ? 50 : data.z,
        willChange: "transform",
      }}
      onMouseDown={e => { e.preventDefault(); onDragStart(e, data.id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {data.content}
    </div>
  );
}

// ─── StickyBoard ──────────────────────────────────────────────────────────────
export default function StickyBoard() {
  const boardRef = useRef(null);
  const dragging = useRef(null);
  const [isDark, toggleTheme] = useTheme();
  const [entries, addEntry]   = useGuestbook();
  const [topId,   setTopId]   = useState(null);
  const [notes,   setNotes]   = useState(null);

  // Initialise pixel positions from % once container is measurable
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const { offsetWidth: W, offsetHeight: H } = el;
    if (!W) return;
    setNotes(NOTES_DEF.map((cfg, i) => ({
      ...cfg,
      x: (cfg.px / 100) * W,
      y: (cfg.py / 100) * H,
      z: i + 1,
      content: null,
    })));
  }, []);

  // Inject live content on every render (depends on isDark / entries)
  const rendered = notes?.map(n => {
    let content;
    const c = n.textColor;
    switch (n.id) {
      case "bio":       content = <BioNote color={c} />; break;
      case "links":     content = <LinksNote color={c} />; break;
      case "theme":     content = <ThemeNote color={c} isDark={isDark} toggle={toggleTheme} />; break;
      case "guestbook": content = <GuestbookNote color={c} entries={entries} onAdd={addEntry} />; break;
      default:          content = null;
    }
    return { ...n, content };
  });

  // Drag
  const startDrag = useCallback((e, id) => {
    setTopId(id);
    const note = notes.find(n => n.id === id);
    dragging.current = { id, sx: e.clientX, sy: e.clientY, ox: note.x, oy: note.y };
  }, [notes]);

  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return;
      const { id, sx, sy, ox, oy } = dragging.current;
      setNotes(prev => prev.map(n =>
        n.id === id ? { ...n, x: ox + e.clientX - sx, y: oy + e.clientY - sy } : n
      ));
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  return (
    <div
      ref={boardRef}
      style={{
        width: "100%", height: "100%",
        background: "#111111",
        position: "relative", overflow: "hidden",
      }}
    >
      {rendered?.map(n => (
        <Note key={n.id} data={n} onDragStart={startDrag} isTop={topId === n.id} />
      ))}
    </div>
  );
}
