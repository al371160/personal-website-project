require("dotenv").config();
const express = require("express");
// express v5 requires explicit error forwarding in async routes

const { Client } = require("@notionhq/client");

const app = express();
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// GET /api/artwork — returns artwork entries from Notion
app.get("/api/artwork", async (req, res, next) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_ARTWORK_DB,
      sorts: [{ property: "Date", direction: "descending" }],
      filter: { property: "Image", files: { is_not_empty: true } },
    });

    const items = response.results.map((page) => {
      const props = page.properties;

      // Title
      const title =
        props.Name?.title?.[0]?.plain_text ?? "Untitled";

      // Date
      const date = props.Date?.date?.start ?? null;

      // Description (rich text)
      const description =
        props.Description?.rich_text?.map((r) => r.plain_text).join("") ?? "";

      // All image attachments
      const images = (props.Image?.files ?? []).map((f) => {
        if (f.type === "file") return f.file.url;
        if (f.type === "external") return f.external.url;
        return null;
      }).filter(Boolean);

      return { id: page.id, title, date, description, images };
    });

    res.json(items);
  } catch (err) {
    console.error("Notion API error:", err.message);
    next(err);
  }
});

// Express v5 error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));
