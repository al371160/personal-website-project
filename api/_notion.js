// Shared Notion query logic used by both the local Express server and Vercel serverless function

const VIDEO_EXTS = /\.(mp4|mov|webm|ogg|m4v|avi)(\?|$)/i;

function fileToMedia(f) {
  const url = f.type === "file" ? f.file.url : f.type === "external" ? f.external.url : null;
  if (!url) return null;
  return { url, type: VIDEO_EXTS.test(url) ? "video" : "image" };
}

async function queryWorks(notion, dbId) {
  const response = await notion.databases.query({
    database_id: dbId,
    sorts: [{ property: "Name", direction: "ascending" }],
  });

  return response.results.map((page) => {
    const props = page.properties;
    const title       = props.Name?.title?.[0]?.plain_text ?? "Untitled";
    const description = props.Description?.rich_text?.map(r => r.plain_text).join("") ?? "";
    const role        = props.Role?.rich_text?.map(r => r.plain_text).join("")
                        ?? props.Role?.select?.name ?? "";
    const slug        = props.Slug?.rich_text?.[0]?.plain_text
                        ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    // Cover image: check Cover files property, then page.cover
    const coverFiles = props.Cover?.files ?? props.Thumbnail?.files ?? [];
    const cover      = coverFiles.find(f => f.type === "file" || f.type === "external");
    let imageUrl     = null;
    if (cover) {
      imageUrl = cover.type === "file" ? cover.file.url : cover.external.url;
    } else if (page.cover) {
      imageUrl = page.cover.type === "file" ? page.cover.file.url : page.cover.external.url;
    }

    const color = props.Color?.rich_text?.[0]?.plain_text ?? props.Color?.select?.name ?? null;

    return { id: page.id, title, description, slug, role, imageUrl, color };
  });
}

async function queryArtwork(notion, dbId) {
  const response = await notion.databases.query({
    database_id: dbId,
    sorts: [{ property: "Date", direction: "descending" }],
    filter: { property: "Image", files: { is_not_empty: true } },
  });

  return response.results.map((page) => {
    const props = page.properties;
    const title       = props.Name?.title?.[0]?.plain_text ?? "Untitled";
    const date        = props.Date?.date?.start ?? null;
    const description = props.Description?.rich_text?.map((r) => r.plain_text).join("") ?? "";
    const files       = (props.Image?.files ?? []).map(fileToMedia).filter(Boolean);
    return { id: page.id, title, date, description, files };
  });
}

module.exports = { queryArtwork, queryWorks };
