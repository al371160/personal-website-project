const { Client } = require("@notionhq/client");
const { queryPlayground } = require("./_notion");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

module.exports = async (req, res) => {
  try {
    const items = await queryPlayground(notion, process.env.NOTION_PLAYGROUND_DB);
    res.json(items);
  } catch (err) {
    console.error("Notion error:", err.message);
    res.status(500).json({ error: err.message });
  }
};