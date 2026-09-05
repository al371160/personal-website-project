import { useEffect } from "react";
import CanvasGallery from "../components/CanvasGallery";
import KoiPond from "../components/KoiPond";
import ModelTurntable from "../components/ModelTurntable";

const CARDS = [
  { id: 1, x: 40, y: 700, w: 320, h: 200, label: "Card A" },
  { id: 2, x: 620, y: 700, w: 260, h: 160, label: "Card B" },
  { id: 3, x: 1160, y: 700, w: 280, h: 180, label: "Card C" },
];

export default function Playground({ onReady, onProgress }) {
  useEffect(() => {
    onProgress?.(100);
    onReady?.();
  }, [onReady, onProgress]);

  return (
    <main className="page page-canvas">
      <CanvasGallery>
        <div className="canvas-card canvas-card--koi canvas-card--interactive">
          <KoiPond />
        </div>
        <div className="canvas-card canvas-card--ascii canvas-card--interactive">
          <ModelTurntable />
        </div>
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="canvas-card canvas-card--placeholder"
            style={{ left: card.x, top: card.y, width: card.w, height: card.h }}
          >
            <span>{card.label}</span>
          </div>
        ))}
      </CanvasGallery>
    </main>
  );
}
