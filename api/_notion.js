// Shared Notion query logic used by both the local Express server and Vercel serverless function

const VIDEO_EXTS = /\.(mp4|mov|webm|ogg|m4v|avi)(\?|$)/i;

function fileToMedia(f) {
  const url = f.type === "file" ? f.file.url : f.type === "external" ? f.external.url : null;
  if (!url) return null;
  return { url, type: VIDEO_EXTS.test(url) ? "video" : "image" };
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

module.exports = { queryArtwork };
