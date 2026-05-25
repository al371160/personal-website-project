import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const cursorRef  = useRef(null);
  const measureRef = useRef(null); // invisible span used to measure text width
  const [label,   setLabel]   = useState("");
  const [visible, setVisible] = useState(false);

  // Morph size whenever label changes
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;
    if (label) {
      const textW = measureRef.current?.offsetWidth ?? 80;
      el.style.width        = `${textW + 26}px`;
      el.style.height       = "30px";
      el.style.borderRadius = "15px";
    } else {
      el.style.width        = "12px";
      el.style.height       = "12px";
      el.style.borderRadius = "6px";
    }
  }, [label]);

  // Register pointer listeners once
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const onMove = (e) => {
      el.style.left = `${e.clientX}px`;
      el.style.top  = `${e.clientY}px`;
      setVisible(true);
    };

    const onOver = (e) => {
      const card = e.target.closest("[data-cursor-label]");
      setLabel(card ? card.dataset.cursorLabel : "");
    };

    const onLeave = () => {
      setVisible(false);
      setLabel("");
    };

    window.addEventListener("pointermove",  onMove,  { passive: true, capture: true });
    document.addEventListener("mouseover",  onOver,  { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove",  onMove, { capture: true });
      document.removeEventListener("mouseover",  onOver);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      {/* Off-screen measuring span — gives us the natural text width */}
      <span
        ref={measureRef}
        aria-hidden="true"
        style={{
          position:      "fixed",
          visibility:    "hidden",
          top:           0,
          left:          0,
          pointerEvents: "none",
          whiteSpace:    "nowrap",
          fontFamily:    "'DM Mono', monospace",
          fontSize:      "11px",
          fontWeight:    "300",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </span>

      <div
        ref={cursorRef}
        className={[
          "custom-cursor",
          visible ? "custom-cursor--visible"  : "",
          label   ? "custom-cursor--labeled"  : "",
        ].filter(Boolean).join(" ")}
      >
        <span className="custom-cursor-label">{label}</span>
      </div>
    </>
  );
}
