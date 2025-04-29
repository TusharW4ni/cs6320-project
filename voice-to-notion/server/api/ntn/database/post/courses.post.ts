import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  const { parentPageId, apiKey } = await readBody(event);
  try {
    if (!apiKey) {
      return { error: "No key provided" };
    }
    if (!parentPageId) {
      return { error: "No parent page ID provided" };
    }

    const notion = new Client({ auth: apiKey });

    const res = await notion.databases.create({
      parent: {
        type: "page_id",
        page_id: parentPageId,
      },
      title: [
        {
          type: "text",
          text: {
            content: "Courses",
            link: null,
          },
        },
      ],
      properties: {
        Name: {
          title: {},
        },
        Code: {
          rich_text: {},
        },
        Timing: {
          rich_text: {},
        },
        Location: {
          rich_text: {},
        },
        Professor: {
          rich_text: {},
        },
      },
    });

    setResponseStatus(event, 200);
    return res;
  } catch (e) {
    setResponseStatus(event, 500);
    return { error: "Failed to create courses database" };
  }
});
