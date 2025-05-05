async function updateDatabaseTitle(databaseId, newTitle) {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          title: [
            {
              type: "text",
              text: {
                content: newTitle,
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `Error updating database title: ${response.status} ${response.statusText}`
      );
      const errorData = await response.json();
      console.error(errorData);
      return;
    }

    const data = await response.json();
    console.log("Database title updated successfully:", data);
  } catch (error) {
    console.error("Error updating database title:", error);
  }
}

const databaseId = "1ead52e75c848039af5fed608bfc8785";
const newTitle = "Assignments";

updateDatabaseTitle(databaseId, newTitle);
