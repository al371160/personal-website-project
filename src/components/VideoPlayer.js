import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { optimizeVideo, videoPoster } from "../utils/cloudinary";

const IS_DEV = process.env.NODE_ENV === "development";

// Starts paused on a poster frame.
// - "controls": play/pause button (and click-to-toggle); nothing downloads until played.
// - "hover": no UI; the parent calls play()/pause() via ref (e.g. on card hover).
// Localhost never auto-downloads video (Cloudinary free-plan bandwidth). Hover
// stays on the poster. Controls still play if you click.
const VideoPlayer = forwardRef(function VideoPlayer(
  { src, width, duration, mode = "controls", title },
  ref
) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [armed, setArmed] = useState(!IS_DEV);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (IS_DEV) return;
      videoRef.current?.play().catch(() => {});
    },
    pause: () => videoRef.current?.pause(),
  }), []);

  useEffect(() => {
    if (!armed) return;
    const v = videoRef.current;
    if (v && playing) v.play().catch(() => {});
  }, [armed, playing]);

  const toggle = () => {
    const v = videoRef.current;
    if (IS_DEV && !armed) {
      setArmed(true);
      setPlaying(true);
      return;
    }
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const poster = videoPoster(src, width);
  const videoSrc = armed ? optimizeVideo(src, { width, duration }) : undefined;
  // Without a poster (non-Cloudinary src), load metadata so the first frame can show.
  const preload = !videoSrc ? "none" : mode === "hover" || !poster ? "metadata" : "none";

  const video = (
    <video
      ref={videoRef}
      src={videoSrc}
      poster={poster}
      preload={preload}
      muted
      loop
      playsInline
      aria-label={title}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onClick={mode === "controls" ? toggle : undefined}
    />
  );

  if (mode !== "controls") return video;

  return (
    <div className="video-player">
      {video}
      <button
        type="button"
        className="video-player-toggle"
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        )}
      </button>
    </div>
  );
});

export default VideoPlayer;
