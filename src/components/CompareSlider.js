import { useRef, useState } from "react";
import { optimizeImage } from "../utils/cloudinary";

const FULL_WIDTH = 2000;

export default function CompareSlider({ before, after, beforeCaption, afterCaption }) {
  const frameRef = useRef(null);
  const dragRef = useRef(null);
  const [pos, setPos] = useState(50);
  const [ratio, setRatio] = useState(1024 / 549);

  function moveTo(clientX) {
    const rect = frameRef.current.getBoundingClientRect();
    if (!rect.width) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      dragging: false,
    };
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.dragging) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null;
        return;
      }
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    moveTo(event.clientX);
  }

  function onPointerUp(event) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.dragging) moveTo(event.clientX);
  }

  function onKeyDown(event) {
    const step = event.shiftKey ? 10 : 2;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPos((value) => Math.max(0, value - step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPos((value) => Math.min(100, value + step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPos(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPos(100);
    }
  }

  function onBeforeLoad(event) {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth && naturalHeight) setRatio(naturalWidth / naturalHeight);
  }

  return (
    <figure className="detail-block compare">
      <div
        className="compare-frame"
        ref={frameRef}
        style={{ aspectRatio: ratio }}
        role="slider"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)} percent before, the rest after`}
        aria-label="Before and after. The first screen is left of the bar, the revision is right."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <img
          className="compare-img"
          src={optimizeImage(after, FULL_WIDTH)}
          alt={afterCaption || "After"}
          draggable={false}
        />
        <img
          className="compare-img compare-img--before"
          src={optimizeImage(before, FULL_WIDTH)}
          alt={beforeCaption || "Before"}
          draggable={false}
          onLoad={onBeforeLoad}
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />
        <div className="compare-bar" style={{ left: `${pos}%` }} aria-hidden="true">
          <span className="compare-grip">
            <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden="true">
              <path d="M5 1 L1 5 L5 9" stroke="currentColor" strokeWidth="1.4" />
              <path d="M13 1 L17 5 L13 9" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        </div>
      </div>
      {(beforeCaption || afterCaption) && (
        <figcaption className="compare-caption">
          {beforeCaption && <span>{beforeCaption}</span>}
          {afterCaption && <span>{afterCaption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
