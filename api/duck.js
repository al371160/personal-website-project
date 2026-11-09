const { Client } = require("@notionhq/client");
const { handleDuck } = require("./_notion");

const notion = new Client({ auth: process.env.NOTION_TOKEN });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { status, json } = await handleDuck(notion, process.env.NOTION_DUCK_DB, req.body);
    res.status(status).json(json);
  } catch (err) {
    console.error("Notion error:", err.message);
    res.status(500).json({ error: "Couldn't save message" });
  }
};
