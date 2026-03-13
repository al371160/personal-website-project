require("dotenv").config();
const express = require("express");
const { Client } = require("@notionhq/client");
const { queryArtwork } = require("./api/_notion");

const app = express();
const notion = new Client({ auth: process.env.NOTION_TOKEN });

app.get("/api/artwork", async (req, res, next) => {
  try {
    const items = await queryArtwork(notion, process.env.NOTION_ARTWORK_DB);
    res.json(items);
  } catch (err) {
    console.error("Notion API error:", err.message);
    next(err);
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => console.log(`API server running on :${PORT}`));
