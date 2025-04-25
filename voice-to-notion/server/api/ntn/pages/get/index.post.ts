import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  const { apiKey } = await readBody(event);
  if (!apiKey) {
    return { error: "No key provided" };
  }

  const notion = new Client({ auth: apiKey as string });

  const { results } = await notion.search({
    sort: {
      direction: "descending",
      timestamp: "last_edited_time",
    },
  });

  return results;
});
