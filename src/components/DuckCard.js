import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const MORE_WORK = "/playground";

// The duck's little phone menu:
//   menu     → "Press 1 to leave your thoughts, press 2 to see what more do I have."
//   feedback → a plain square to type in, enter icon bottom-right (posts to /api/duck)
//   thanks   → "Thank you so much!"
//   more     → "...Click again to continue", next click goes to More Work
// `anchor` is the page position (px) of the box's top-left: right next to the
// plus cursor where the duck was clicked.
export default function DuckCard({ anchor, onClose, onStep }) {
  const navigate = useNavigate();
  const [step, setStep] = useState("menu"); // menu | feedback | thanks | more
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState("idle"); // idle | sending | failed
  const [error, setError] = useState("");
  const textRef = useRef(null);
  const cardRef = useRef(null);
  const [pos, setPos] = useState(anchor);

  // let the pool know which step we're on, so clicking the duck itself can
  // continue to More Work
  useEffect(() => {
    onStep?.(step);
  }, [step, onStep]);

  // keep the box on screen if it opens near the right or bottom edge
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const maxX = window.scrollX + window.innerWidth - w - 8;
    const maxY = window.scrollY + window.innerHeight - h - 8;
    setPos({ x: Math.max(8, Math.min(anchor.x, maxX)), y: Math.max(window.scrollY + 8, Math.min(anchor.y, maxY)) });
  }, [anchor, step]);

  const choose = useCallback((option) => {
    if (option === "1") setStep("feedback");
    if (option === "2") setStep("more");
  }, []);

  const submit = useCallback(async () => {
    if (status === "sending") return;
    if (!message.trim()) {
      setError("Type something first.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/duck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, website }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("idle");
      setStep("thanks");
    } catch {
      setStatus("failed");
    }
  }, [message, website, status]);

  // keyboard: 1 / 2 on the menu, Escape closes anywhere
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (step === "menu" && (e.key === "1" || e.key === "2")) {
        e.preventDefault();
        choose(e.key);
      } else if (step === "more" && e.key === "Enter") navigate(MORE_WORK);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, choose, onClose, navigate]);

  // focus whatever the current step needs
  useEffect(() => {
    if (step === "feedback") textRef.current?.focus();
    else cardRef.current?.focus();
  }, [step]);

  return (
    <div
      className={`duck-card duck-card--${step}`}
      role="dialog"
      aria-label="Rubber duck"
      tabIndex={-1}
      ref={cardRef}
      style={{ left: pos.x, top: pos.y }}
      onClick={step === "more" ? () => navigate(MORE_WORK) : undefined}
    >
      <button
        type="button"
        className="duck-card-close"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>

      {step === "menu" && (
        <>
          <p className="duck-card-title">The duck says:</p>
          <p className="duck-card-line">
            Press{" "}
            <button type="button" className="duck-card-key" onClick={() => choose("1")}>1</button>{" "}
            to leave your thoughts, press{" "}
            <button type="button" className="duck-card-key" onClick={() => choose("2")}>2</button>{" "}
            to see what more do I have.
          </p>
        </>
      )}

      {step === "feedback" && (
        <>
          <p className="duck-card-title">Please type in your feedback</p>
          <div className="duck-card-pad">
            <textarea
              ref={textRef}
              maxLength={2000}
              value={message}
              aria-label="Your feedback"
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
                if (status === "failed") setStatus("idle");
              }}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter makes a new line
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button
              type="button"
              className="duck-card-enter"
              aria-label="Send"
              disabled={status === "sending"}
              onClick={submit}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M20 5v7a3 3 0 0 1-3 3H6m0 0 4-4m-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </button>
          </div>
          <input
            className="duck-card-hp"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
          />
          {error && <p className="duck-card-error">{error}</p>}
          {status === "failed" && (
            <p className="duck-card-error">
              The duck couldn't deliver that. <a href="mailto:aliu10@seas.upenn.edu">Email me instead</a>.
            </p>
          )}
        </>
      )}

      {step === "thanks" && (
        <>
          <p className="duck-card-title">The duck says:</p>
          <p className="duck-card-line">Thank you so much!</p>
        </>
      )}

      {step === "more" && (
        <>
          <p className="duck-card-title">The duck says:</p>
          <p className="duck-card-line">Thank you so much for taking a look! Click on me again to continue</p>
        </>
      )}
    </div>
  );
}
