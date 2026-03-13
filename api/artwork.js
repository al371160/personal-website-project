const { Client } = require("@notionhq/client");
const { queryArtwork } = require("./_notion");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

module.exports = async (req, res) => {
  try {
    const items = await queryArtwork(notion, process.env.NOTION_ARTWORK_DB);
    res.json(items);
  } catch (err) {
    console.error("Notion error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
