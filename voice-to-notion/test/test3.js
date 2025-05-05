import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function updateDatabaseTitle(databaseId, newTitle) {
  try {
    const response = await notion.databases.update({
      database_id: databaseId,
      title: [
        {
          type: "text",
          text: {
            content: newTitle,
          },
        },
      ],
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error(error);
  }
}

// Replace with your actual database ID
const databaseId = "1ead52e75c848039af5fed608bfc8785";
const newTitle = "Books Read";

updateDatabaseTitle(databaseId, newTitle);
