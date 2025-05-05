import vm from "node:vm";
import { Client } from "@notionhq/client";

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
