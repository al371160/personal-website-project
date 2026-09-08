import { useCallback, useEffect, useRef, useState } from "react";
import { MediaEl, MultiIcon } from "./Lightbox";

export default function PlaygroundCard({
  tile,
  x,
  y,
  w,
  h,
  onRatio,
  focused,
  detailIndex = 0,
  gestureRef,
  onDetail,
  onNav,
}) {
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "800px 800px 800px 800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isProject = tile.kind === "project";
  const files = isProject ? tile.files ?? [] : [];
  const Component = tile.component;
  const mediaIndex = focused ? detailIndex : 0;
  const file = files[mediaIndex];
  const mediaRef = useRef(null);

  const reportRatio = useCallback((el) => {
    if (!el) return;
    const nw = el.naturalWidth ?? el.videoWidth;
    const nh = el.naturalHeight ?? el.videoHeight;
    if (nw && nh) onRatio?.(tile.id, mediaIndex, nw / nh);
  }, [onRatio, tile.id, mediaIndex]);

  const onLoad = useCallback((e) => reportRatio(e.currentTarget), [reportRatio]);

  // Report the displayed media file's natural ratio so the card box can match
  // it. `onLoad` alone is unreliable: cached images may have already fired
  // `load` before React attaches the handler, and videos fire `loadeddata`,
  // not `load`. This effect reads the element directly once it has dimensions.
  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    const ready =
      el.tagName === "VIDEO" ? el.videoWidth > 0 : el.complete && el.naturalWidth > 0;
    if (ready) reportRatio(el);
  }, [file, mediaIndex, reportRatio]);

  const activate = () => {
    // A pan/rotate drag must not "click" the card into detail mode.
    if (gestureRef?.current) return;
    onDetail?.();
  };

  return (
    <div
      ref={ref}
      className={`mosaic-card mosaic-card--${tile.kind}${focused ? " mosaic-card--focused" : ""}`}
      style={{ left: x, top: y, width: w, height: h }}
      role="button"
      tabIndex={0}
      onClick={activate}
      onKeyDown={(e) => e.key === "Enter" && activate()}
    >
      {tile.kind === "webgl" ? (
        active && Component ? (
          <Component />
        ) : (
          <div className="mosaic-card-fallback" />
        )
      ) : (
        active && file && (
          <MediaEl
            file={file}
            alt={tile.title}
            mediaRef={mediaRef}
            onLoad={onLoad}
          />
        )
      )}

      <div className="mosaic-card-top">
        {files.length > 1 && (
          <span className="mosaic-card-badge" title={`${files.length} files`}>
            <MultiIcon />
            <span>{files.length}</span>
          </span>
        )}
      </div>

      {focused && files.length > 1 && (
        <>
          <button
            className="mosaic-arrow mosaic-arrow--prev"
            aria-label={`Previous image for ${tile.title}`}
            onClick={(e) => { e.stopPropagation(); onNav?.(-1); }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            ‹
          </button>
          <button
            className="mosaic-arrow mosaic-arrow--next"
            aria-label={`Next image for ${tile.title}`}
            onClick={(e) => { e.stopPropagation(); onNav?.(1); }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}