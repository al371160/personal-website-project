import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { optimizeVideo, videoPoster } from "../utils/cloudinary";

// Starts paused on a poster frame.
// - "controls": play/pause button (and click-to-toggle); nothing downloads until played.
// - "hover": no UI; the parent calls play()/pause() via ref (e.g. on card hover).
const VideoPlayer = forwardRef(function VideoPlayer(
  { src, width, duration, mode = "controls", title },
  ref
) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play().catch(() => {}),
    pause: () => videoRef.current?.pause(),
  }), []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const poster = videoPoster(src, width);
  // Without a poster (non-Cloudinary src), load metadata so the first frame can show.
  const preload = mode === "hover" || !poster ? "metadata" : "none";

  const video = (
    <video
      ref={videoRef}
      src={optimizeVideo(src, { width, duration })}
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
