import vm from "node:vm";
import { Client } from "@notionhq/client";
/*
let codeToExecute = `
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

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
  } catch (error) {
    console.error(error);
  }
}

const databaseId = '1ead52e75c848039af5fed608bfc8785';
const newTitle = 'Assignments';

updateDatabaseTitle(databaseId, newTitle);
`;*/

let codeToExecute = `
async function getDatabaseId(pageId, databaseName) {
  const url = https://api.notion.com/v1/search;
  const headers = {
    "Authorization": Bearer ${process.env.NOTION_API_KEY},
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };

  const payload = {
    "filter": {
      "value": "database",
      "property": "object"
    },
    "parent": {
      "type": "page_id",
      "page_id": pageId
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (data.results && data.results.length > 0) {
    for (const result of data.results) {
      if (result.title[0].plain_text === databaseName) {
        return result.id;
      }
    }
  }
  return null;
}

async function createSelectProperty(databaseId, propertyName) {
  const url = https://api.notion.com/v1/databases/${databaseId};
  const headers = {
    "Authorization": Bearer ${process.env.NOTION_API_KEY},
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28",
  };

  const payload = {
    "properties": {
      [propertyName]: {
        "select": {
          "options": []
        }
      }
    }
  };

  const response = await fetch(url, {
    method: "PATCH",
    headers: headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return data;
}

async function main() {
  const pageId = "1e3d52e7-5c84-8054-9cff-f26d674d0295";
  const databaseName = "Test 2";
  const propertyName = "Hello";

  const databaseId = await getDatabaseId(pageId, databaseName);

  if (databaseId) {
    const result = await createSelectProperty(databaseId, propertyName);
    console.log("Property created:", result);
  } else {
    console.log("Database not found.");
  }
}

main();
`;
try {
  console.log("Executing generated code:", codeToExecute);
  //const notion = new Client();
  executionResult = await eval(codeToExecute);
  /*const context = {};
  const result = vm.runInNewContext(codeToExecute, context);
  console.log(result); // Output: 20*/
  console.log("Code execution result:", executionResult);
} catch (e) {
  console.error("Error executing generated code:", e);
}
