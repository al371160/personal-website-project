// Notion playground rows become sphere tiles. Video-only rows are skipped
// because the sphere only shows stills. WebGL cards stay in their component
// files and are not part of this page.
export function notionSphereImages(items = []) {
  const images = [];
  for (const item of items) {
    const file = (item.files ?? []).find((entry) => entry.type === "image" && entry.url);
    if (!file) continue;
    const title = item.title ?? "Untitled";
    images.push({
      id: `pg-${item.id}`,
      src: file.url,
      alt: title,
      title,
      description: item.description ?? "",
    });
  }
  return images;
}
