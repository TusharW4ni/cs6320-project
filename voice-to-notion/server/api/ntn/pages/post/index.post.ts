import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  console.log("Processing request to create a Notion page...");
  try {
    const { ntnApiKey, parentPageTitle, title, content } = await readBody(
      event
    );

    if (!ntnApiKey) {
      setResponseStatus(event, 400);
      return { error: "Notion API key is required." };
    }

    const notion = new Client({ auth: ntnApiKey || "" });

    if (!title) {
      setResponseStatus(event, 400);
      return { error: "Title is required." };
    }

    const retrievedPage = await notion.search({
      query: parentPageTitle || "",
      filter: {
        value: "page",
        property: "object",
      },
    });

    const parentPageId = retrievedPage.results[0].id;

    const createdPage = await notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content,
                },
              },
            ],
          },
        },
      ],
    });
    setResponseStatus(event, 201);
    console.log("Page created successfully:", createdPage);
    return { message: "Page created successfully", createdPage };
  } catch (e) {
    console.error("Error creating page:", e);
    setResponseStatus(event, 500);
    return { error: "Failed to create page." };
  }
});
