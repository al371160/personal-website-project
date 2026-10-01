function decode(img) {
  return (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
}

// Resolves once an image has loaded (or failed) and is decoded, so it's paintable.
function imageSettled(img) {
  return new Promise((resolve) => {
    if (img.complete) { resolve(decode(img)); return; }
    img.addEventListener("load", () => resolve(decode(img)), { once: true });
    img.addEventListener("error", resolve, { once: true });
  });
}

// Waits for every <img> under `root` and every <video>'s poster frame.
// Videos start paused and don't download up front, so their poster is what's visible.
export function waitForMedia(root, onProgress) {
  const imgs = [...root.querySelectorAll("img")];
  const posters = [...root.querySelectorAll("video")]
    .map((v) => v.getAttribute("poster"))
    .filter(Boolean)
    .map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });

  const all = [...imgs, ...posters];
  if (all.length === 0) {
    onProgress?.(100);
    return Promise.resolve();
  }

  let completed = 0;
  return Promise.all(
    all.map((img) =>
      imageSettled(img).then(() => {
        completed++;
        onProgress?.(Math.round((completed / all.length) * 100));
      })
    )
  );
}
