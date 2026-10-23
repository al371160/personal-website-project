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
  if (count <= 6) return { radiusRatio: 0.32, imageScale: 0.28 };
  if (count <= 12) return { radiusRatio: 0.34, imageScale: 0.24 };
  if (count <= 24) return { radiusRatio: 0.36, imageScale: 0.2 };
  return { radiusRatio: 0.38, imageScale: 0.17 };
}

// Opaque in front, gone well into the back hemisphere. Smoothstep so a drag
// eases images out instead of popping them at a hard depth cutoff.
function fadeForDepth(z, radius) {
  const fadeStart = radius * 0.2;
  const fadeEnd = -radius * 0.72;
  const t = Math.max(0, Math.min(1, (z - fadeEnd) / (fadeStart - fadeEnd)));
  return t * t * (3 - 2 * t);
}

function projectPositions(spherical, rotation, radius) {
  const rotX = degreesToRadians(rotation.x);
  const rotY = degreesToRadians(rotation.y);

  return spherical.map((pos) => {
    const theta = degreesToRadians(pos.theta);
    const phi = degreesToRadians(pos.phi);

    let x = radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.cos(phi);
    let z = radius * Math.sin(phi) * Math.sin(theta);

    const x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
    const z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
    x = x1;
    z = z1;

    const y2 = y * Math.cos(rotX) - z * Math.sin(rotX);
    const z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
    y = y2;
    z = z2;

    const depth = (z + radius) / (2 * radius);
    return {
      x,
      y,
      z,
      scale: 0.82 + depth * 0.36,
      zIndex: Math.round(1000 + z),
      fadeOpacity: fadeForDepth(z, radius),
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
  dragSensitivity = 0.5,
  momentumDecay = 0.96,
  maxRotationSpeed = 6,
  perspective = 1000,
  autoRotate = true,
  autoRotateSpeed = 0.2,
  onReady,
  onProgress,
}) {
  const { radiusRatio, imageScale } = layoutScale(images.length);
  const sphereRadius = containerSize * radiusRatio;
  const longEdge = containerSize * imageScale;

  const [rotation, setRotation] = useState({ x: 15, y: 15, z: 0 });
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
    () => projectPositions(spherical, rotation, sphereRadius),
    [spherical, rotation, sphereRadius]
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
        style={{
          width: containerSize,
          height: containerSize,
          perspective: `${perspective}px`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {images.map((image, index) => {
          const position = worldPositions[index];
          if (!position || position.fadeOpacity < 0.02) return null;
          const { width, height } = tileSize(longEdge * position.scale, image.ratio);
          const popped = hoveredIndex === index && !isDragging && position.fadeOpacity > 0.85;
          return (
            <div
              key={image.id}
              data-sphere-id={image.id}
              className={`sphere-node${popped ? " sphere-node--hover" : ""}`}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                left: `${containerSize / 2 + position.x}px`,
                top: `${containerSize / 2 + position.y}px`,
                opacity: position.fadeOpacity,
                zIndex: position.zIndex,
                pointerEvents: position.fadeOpacity > 0.45 ? "auto" : "none",
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
                {selectedImage.title && <h3>{selectedImage.title}</h3>}
                {selectedImage.href ? (
                  <Link to={selectedImage.href} className="detail-visit-btn">
                    Go to project
                    <span className="detail-visit-btn-icon" aria-hidden="true">↗</span>
                  </Link>
                ) : (
                  selectedImage.description && <p>{selectedImage.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
