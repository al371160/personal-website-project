const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

module.exports = async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_ARTWORK_DB,
      sorts: [{ property: "Date", direction: "descending" }],
      filter: { property: "Image", files: { is_not_empty: true } },
    });

    const items = response.results.map((page) => {
      const props = page.properties;

      const title = props.Name?.title?.[0]?.plain_text ?? "Untitled";
      const date = props.Date?.date?.start ?? null;
      const description =
        props.Description?.rich_text?.map((r) => r.plain_text).join("") ?? "";

      const images = (props.Image?.files ?? [])
        .map((f) => {
          if (f.type === "file") return f.file.url;
          if (f.type === "external") return f.external.url;
          return null;
        })
        .filter(Boolean);

      return { id: page.id, title, date, description, images };
    });

    res.json(items);
  } catch (err) {
    console.error("Notion error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
