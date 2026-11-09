import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { waitForMedia } from "../utils/waitForMedia";

const DRAG_CLICK_THRESHOLD = 5;


function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function normalizeAngle(angle) {
  let next = angle;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return next;
}

// Stable stand-in for Math.random so a remount doesn't reshuffle the sphere.
function unitNoise(index) {
  const value = Math.sin(index * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

function fibonacciPositions(count) {
  const positions = [];
  const angleIncrement = (2 * Math.PI) / ((1 + Math.sqrt(5)) / 2);

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / count;
    const inclination = Math.acos(1 - 2 * t);
    const azimuth = angleIncrement * i;

    let phi = inclination * (180 / Math.PI);
    let theta = (azimuth * (180 / Math.PI)) % 360;

    const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
    phi = phi < 90 ? Math.max(5, phi - poleBonus) : Math.min(175, phi + poleBonus);
    phi = 15 + (phi / 180) * 150;

    theta = (theta + (unitNoise(i) - 0.5) * 20 + 360) % 360;
    phi = Math.max(0, Math.min(180, phi + (unitNoise(i + 100) - 0.5) * 10));
    positions.push({ theta, phi });
  }

  return positions;
}

function layoutScale(count) {
  if (count <= 6) return 0.22;
  if (count <= 12) return 0.17;
  if (count <= 24) return 0.14;
  return 0.115;
}

const smooth = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Points on a sphere stretched into a wide ellipsoid, then projected with
// perspective. Depth (0 = far, 1 = near) drives scale, opacity, blur and
// stacking, so every tile is strictly in front of or behind its neighbours.
function projectPositions(spherical, rotation, radii, perspective) {
  const rotX = degreesToRadians(rotation.x);
  const rotY = degreesToRadians(rotation.y);

  return spherical.map((pos, index) => {
    const theta = degreesToRadians(pos.theta);
    const phi = degreesToRadians(pos.phi);

    let x = Math.sin(phi) * Math.cos(theta);
    let y = Math.cos(phi);
    let z = Math.sin(phi) * Math.sin(theta);

    const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
    const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
    x = x1;
    z = z1;

    const y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
    const z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
    y = y2;
    z = z2;

    const depth = (z + 1) / 2;
    const zWorld = z * radii.z;
    const persp = perspective / (perspective - zWorld);
    return {
      x: x * radii.x * persp,
      y: y * radii.y * persp,
      depth,
      scale: persp * (0.8 + depth * 0.3),
      // depth plus a tiny per-index offset so no two tiles ever tie
      zIndex: Math.round(depth * 100000) * 100 + index,
      opacity: 0.22 + 0.78 * smooth(0.12, 0.72, depth),
      blur: (1 - smooth(0.3, 0.82, depth)) * 9,
    };
  });
}

function tileSize(longEdge, ratio) {
  const safeRatio = ratio > 0 ? ratio : 1;
  if (safeRatio >= 1) return { width: longEdge, height: longEdge / safeRatio };
  return { width: longEdge * safeRatio, height: longEdge };
}

export default function SphereImageGrid({
  images = [],
  containerSize = 600,
  containerWidth,
  containerHeight,
  dragSensitivity = 0.5,
  momentumDecay = 0.96,
  maxRotationSpeed = 6,
  perspective = 1400,
  autoRotate = true,
  autoRotateSpeed = 0.2,
  onReady,
  onProgress,
}) {
  const stageW = containerWidth ?? containerSize;
  const stageH = containerHeight ?? containerSize;
  const minSide = Math.min(stageW, stageH);
  const longEdge = minSide * layoutScale(images.length);
  const radii = useMemo(
    () => ({ x: Math.min(stageW * 0.32, minSide * 0.62), y: stageH * 0.22, z: minSide * 0.42 }),
    [stageW, stageH, minSide]
  );

  const [rotation, setRotation] = useState({ x: 8, y: 15, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const containerRef = useRef(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const dragDistance = useRef(0);
  const pressId = useRef(null);
  const selectedRef = useRef(null);
  selectedRef.current = selectedImage;

  const spherical = useMemo(() => fibonacciPositions(images.length), [images.length]);
  const worldPositions = useMemo(
    () => projectPositions(spherical, rotation, radii, perspective),
    [spherical, rotation, radii, perspective]
  );

  const clampSpeed = useCallback((speed) => {
    return Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed));
  }, [maxRotationSpeed]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;
    let cancelled = false;
    waitForMedia(root, onProgress).then(() => {
      if (!cancelled) onReady?.();
    });
    const timeout = setTimeout(() => {
      if (!cancelled) {
        onProgress?.(100);
        onReady?.();
      }
    }, 15000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [images, onReady, onProgress]);

  useEffect(() => {
    if (!selectedImage) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedImage]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (!draggingRef.current) {
        const velocity = velocityRef.current;
        const nextVelocity = {
          x: velocity.x * momentumDecay,
          y: velocity.y * momentumDecay,
        };
        const spinning = autoRotate && !selectedRef.current;
        const moving = Math.abs(nextVelocity.x) >= 0.01 || Math.abs(nextVelocity.y) >= 0.01;
        if (!spinning && !moving) {
          velocityRef.current = { x: 0, y: 0 };
        } else {
          velocityRef.current = moving ? nextVelocity : { x: 0, y: 0 };
          setRotation((prev) => ({
            x: normalizeAngle(prev.x + clampSpeed(velocityRef.current.x)),
            y: normalizeAngle(prev.y + (spinning ? autoRotateSpeed : 0) + clampSpeed(velocityRef.current.y)),
            z: prev.z,
          }));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoRotate, autoRotateSpeed, clampSpeed, momentumDecay]);

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    draggingRef.current = true;
    setIsDragging(true);
    dragDistance.current = 0;
    velocityRef.current = { x: 0, y: 0 };
    lastPointer.current = { x: event.clientX, y: event.clientY };
    pressId.current = event.target.closest?.("[data-sphere-id]")?.dataset.sphereId ?? null;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!draggingRef.current) return;
    const deltaX = event.clientX - lastPointer.current.x;
    const deltaY = event.clientY - lastPointer.current.y;
    dragDistance.current += Math.hypot(deltaX, deltaY);
    const rotationDelta = {
      x: clampSpeed(-deltaY * dragSensitivity),
      y: clampSpeed(deltaX * dragSensitivity),
    };
    setRotation((prev) => ({
      x: normalizeAngle(prev.x + rotationDelta.x),
      y: normalizeAngle(prev.y + rotationDelta.y),
      z: prev.z,
    }));
    velocityRef.current = rotationDelta;
    lastPointer.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = () => {
    const id = pressId.current;
    const moved = dragDistance.current;
    draggingRef.current = false;
    setIsDragging(false);
    pressId.current = null;
    if (moved >= DRAG_CLICK_THRESHOLD || !id) return;
    const image = images.find((item) => item.id === id);
    if (image) setSelectedImage(image);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`sphere${isDragging ? " sphere--dragging" : ""}`}
        style={{ width: stageW, height: stageH }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {images.map((image, index) => {
          const position = worldPositions[index];
          if (!position) return null;
          const { width, height } = tileSize(longEdge, image.ratio);
          const popped = hoveredIndex === index && !isDragging && position.depth > 0.6;
          const front = position.depth > 0.5;
          return (
            <div
              key={image.id}
              data-sphere-id={image.id}
              className={`sphere-node${popped ? " sphere-node--hover" : ""}`}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                left: `${stageW / 2}px`,
                top: `${stageH / 2}px`,
                transform: `translate(-50%, -50%) translate3d(${position.x}px, ${position.y}px, 0) scale(${position.scale * (popped ? 1.04 : 1)})`,
                opacity: position.opacity,
                filter: position.blur > 0.4 ? `blur(${position.blur.toFixed(1)}px)` : "none",
                zIndex: position.zIndex,
                pointerEvents: front ? "auto" : "none",
              }}
              onPointerEnter={() => setHoveredIndex(index)}
              onPointerLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
            >
              <img src={image.src} alt={image.alt} draggable={false} />
              {image.title && <span className="sphere-node-title">{image.title}</span>}
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div
          className="sphere-modal"
          role="presentation"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="sphere-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.title}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sphere-modal-media">
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                style={selectedImage.ratio ? { aspectRatio: String(selectedImage.ratio) } : undefined}
              />
              <button
                type="button"
                className="sphere-modal-close"
                aria-label="Close"
                onClick={() => setSelectedImage(null)}
              >
                <X size={16} />
              </button>
            </div>
            {(selectedImage.title || selectedImage.description || selectedImage.href) && (
              <div className="sphere-modal-body">
                {selectedImage.href ? (
                  // the project name is the button: just the text, outlined
                  <Link to={selectedImage.href} className="project-btn">
                    {selectedImage.title || "Go to project"}
                    <span aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  <>
                    {selectedImage.title && <h3>{selectedImage.title}</h3>}
                    {selectedImage.description && <p>{selectedImage.description}</p>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
