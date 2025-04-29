import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  const { apiKey, query } = await readBody(event);
  if (!apiKey) {
    return { error: "No key provided" };
  }
  if (!query) {
    return { error: "No query provided" };
  }

  // console.log({ apiKey });

  const notion = new Client({ auth: apiKey });

  const response = await notion.search({
    query,
    filter: {
      property: "object",
      value: "database",
    },
    sort: {
      direction: "descending",
      timestamp: "last_edited_time",
    },
  });
  // console.log({ response });
  const filteredRes = response.results.filter(
    (result) => result.archived === false
  );

  return { results: filteredRes || [] };
});
