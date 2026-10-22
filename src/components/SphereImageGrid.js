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
  if (count <= 6) return { radiusRatio: 0.32, imageScale: 0.24 };
  if (count <= 12) return { radiusRatio: 0.34, imageScale: 0.2 };
  if (count <= 24) return { radiusRatio: 0.36, imageScale: 0.18 };
  return { radiusRatio: 0.38, imageScale: 0.15 };
}

function projectPositions(spherical, rotation, radius, baseImageSize) {
  const rotX = degreesToRadians(rotation.x);
  const rotY = degreesToRadians(rotation.y);

  const positions = spherical.map((pos) => {
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

    const fadeZoneStart = -10;
    const fadeZoneEnd = -30;
    const isVisible = z > fadeZoneEnd;
    const fadeOpacity = z <= fadeZoneStart
      ? Math.max(0, (z - fadeZoneEnd) / (fadeZoneStart - fadeZoneEnd))
      : 1;

    const isPole = pos.phi < 30 || pos.phi > 150;
    const distanceRatio = Math.min(Math.hypot(x, y) / radius, 1);
    const centerScale = Math.max(0.62, 1 - distanceRatio * (isPole ? 0.2 : 0.38));
    const depthScale = (z + radius) / (2 * radius);
    const scale = centerScale * Math.max(0.75, 0.85 + depthScale * 0.25);

    return {
      x,
      y,
      z,
      scale,
      zIndex: Math.round(1000 + z),
      isVisible,
      fadeOpacity,
    };
  });

  const adjusted = positions.map((pos) => ({ ...pos }));
  for (let i = 0; i < adjusted.length; i++) {
    const pos = adjusted[i];
    if (!pos.isVisible) continue;

    let adjustedScale = pos.scale;
    const imageSize = baseImageSize * adjustedScale;
    for (let j = 0; j < adjusted.length; j++) {
      if (i === j || !adjusted[j].isVisible) continue;
      const other = adjusted[j];
      const distance = Math.hypot(pos.x - other.x, pos.y - other.y);
      const minDistance = (imageSize + baseImageSize * other.scale) / 2 + 10;
      if (distance < minDistance && distance > 0) {
        const overlap = minDistance - distance;
        const reduction = Math.max(0.72, 1 - (overlap / minDistance) * 0.28);
        adjustedScale = Math.min(adjustedScale, Math.max(pos.scale * 0.62, adjustedScale * reduction));
      }
    }
    adjusted[i] = { ...pos, scale: Math.max(pos.scale * 0.62, adjustedScale) };
  }

  return adjusted;
}

export default function SphereImageGrid({
  images = [],
  containerSize = 600,
  dragSensitivity = 0.5,
  momentumDecay = 0.96,
  maxRotationSpeed = 6,
  hoverScale = 1.2,
  perspective = 1000,
  autoRotate = true,
  autoRotateSpeed = 0.2,
  onReady,
  onProgress,
}) {
  const { radiusRatio, imageScale } = layoutScale(images.length);
  const sphereRadius = containerSize * radiusRatio;
  const baseImageSize = containerSize * imageScale;

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
    () => projectPositions(spherical, rotation, sphereRadius, baseImageSize),
    [spherical, rotation, sphereRadius, baseImageSize]
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
          if (!position?.isVisible) return null;
          const imageSize = baseImageSize * position.scale;
          const popped = hoveredIndex === index && !isDragging;
          const finalScale = popped ? Math.min(hoverScale, hoverScale / position.scale) : 1;
          return (
            <div
              key={image.id}
              data-sphere-id={image.id}
              className="sphere-node"
              style={{
                width: `${imageSize}px`,
                height: `${imageSize}px`,
                left: `${containerSize / 2 + position.x}px`,
                top: `${containerSize / 2 + position.y}px`,
                opacity: position.fadeOpacity,
                transform: `translate(-50%, -50%) scale(${finalScale})`,
                zIndex: position.zIndex,
              }}
              onPointerEnter={() => setHoveredIndex(index)}
              onPointerLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
            >
              <img src={image.src} alt={image.alt} draggable={false} />
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
              <img src={selectedImage.src} alt={selectedImage.alt} />
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
