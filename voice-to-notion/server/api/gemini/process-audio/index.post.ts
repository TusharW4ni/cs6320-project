import fs from "fs";
import path from "path";
import {
  defineEventHandler,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
import { Candidate, GoogleGenAI } from "@google/genai";
import { ChromaClient, GoogleGenerativeAiEmbeddingFunction } from "chromadb";
import {
  createNewPageFn,
  createAssignmentFn,
} from "~/server/api/ntn/assignments/ai-functions";
import {
  ensureAssignmentsDatabase,
  addAssignment,
} from "~/server/api/ntn/assignments/db-service";

const chromaClient = new ChromaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const embedder = new GoogleGenerativeAiEmbeddingFunction({
  apiKeyEnvVar: "GOOGLE_API_KEY",
});

function extractCode(text: string): string | null {
  const codeBlockPattern = /```javascript\n([\s\S]*?)\n```/g;
  const match = codeBlockPattern.exec(text);
  return match ? match[1].trim() : null;
}

let processGemini = async (
  audioBase64: string,
  parentPageId: string,
  mimeType: string
) => {
  //console.log("API: /api/gemini/generate-code/index.post.ts");

  /*let prompt =
    "Update the title of this database to 'Assignments'. The database id is 1ead52e75c848039af5fed608bfc8785";*/

  /*let prompt =
    "Create a property of type Select with name 'Course'. The database id is 1ead52e75c848039af5fed608bfc8785";*/

  /*let prompt =
    "Add options to the property named 'Course'. The options are '1234', '2345', '3456'. The database id is 1ead52e75c848039af5fed608bfc8785";*/

  /*let prompt =
    "create a new page named test1. The parent page id is 1e3d52e75c8480549cfff26d674d0295";*/

  /*let prompt = 
  "create a database with the title "Test" on this page"*/

  /*let prompt = 
  "get the database id for the database named "Test" on this page and use that database id to create a property of type Select with name "Hello""
  */

  /*let prompt = "find the database with title "Test 2" on this page and get the database id for that database, and using that database id, create a property of type select with the name "Hello""*/

  /*let prompt = 'get the database id for the database named "Test" and using that database id, add a page named "Hello world"*/
  let prompt = audioBase64;

  // 1. Query Chroma
  let results;
  try {
    console.log("Querying Chroma...");
    const collection = await chromaClient.getCollection({
      name: "notion_api_docs_default_google",
      embeddingFunction: embedder,
    }); // Or your collection name
    results = await collection.query({
      queryTexts: [prompt],
      nResults: 3, // Adjust as needed
      //include: [documents],
    });
    console.log("Chroma results:", results);
  } catch (error: any) {
    console.error("Chroma query failed:", error);
    return { error: "Failed to query Chroma", details: error.message };
  }
  const context = results.documents.join("\n\n");

  const geminiPrompt = `You are a helpful assistant that can generate JavaScript code to interact with the Notion Rest API (do not use Javascript Notion library). Use the following context to understand the user's request and generate code to fulfill it. Return ONLY the executable javascript code, do not use import or require statements assume that they're already imported, do not include any other text or explanations. Notion token is provided as an environment NOTION_API_KEY variable. The parent page id is ${parentPageId}.

Context:
${context}

`;

  let geminiResponse;
  try {
    console.log("Prompting Gemini...");
    geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: { temperature: 0.8 },
      //contents: [{ text: geminiPrompt }],
      contents: [
        { text: geminiPrompt },
        { inlineData: { data: audioBase64, mimeType } },
      ],
    });
    console.log("Gemini response:", geminiResponse);
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    //setResponseStatus(event, 500);
    return { error: "Gemini API call failed", details: error.message };
  }

  console.log(geminiResponse);

  let responseText: string = "";
  const candidate: Candidate = geminiResponse!.candidates![0];
  if (candidate) {
    responseText = candidate.content!.parts![0].text || "";
  }

  //const responseText = candidate.content?.parts?[0].text || "";

  const codeToExecute: any = extractCode(responseText);
  console.log(responseText);
  console.log(codeToExecute);

  let executionResult;
  try {
    console.log("Executing generated code:", codeToExecute);
    //const notion = new Client();
    executionResult = await eval(codeToExecute);
    console.log("Code execution result:", executionResult);
  } catch (e) {
    console.error("Error executing generated code:", e);
  }
};

export default defineEventHandler(async (event) => {
  console.log("Process Audio start");

  const { GEMINI_KEY } = useRuntimeConfig();
  if (!GEMINI_KEY) {
    console.error("GEMINI_KEY not set");
    setResponseStatus(event, 500);
    return { error: "Gemini API key not configured." };
  }

  let formData: any;
  try {
    formData = await readMultipartFormData(event);
  } catch (err: any) {
    console.error("readMultipartFormData failed:", err);
    setResponseStatus(event, 400);
    return { error: "Invalid multipart form data." };
  }

  const fileEntry = formData.find((f: any) => f.name === "file");
  const ntnApiKeyEntry = formData.find((f: any) => f.name === "ntnApiKey");
  const parentTitleEntry = formData.find(
    (f: any) => f.name === "parentPageTitle"
  );

  if (!fileEntry || !fileEntry.data) {
    console.error("file missing");
    setResponseStatus(event, 400);
    return { error: "Audio file not found." };
  }
  if (!ntnApiKeyEntry || !ntnApiKeyEntry.data) {
    console.error("Notion API key missing");
    setResponseStatus(event, 400);
    return { error: "Notion API key not provided." };
  }
  if (!parentTitleEntry || !parentTitleEntry.data) {
    console.error("Parent page title missing");
    setResponseStatus(event, 400);
    return { error: "Parent page title not provided." };
  }

  const ntnApiKey = ntnApiKeyEntry.data.toString();
  const parentPageTitle = parentTitleEntry.data.toString();
  const audioBuffer = fileEntry.data;
  const mimeType = fileEntry.type || "audio/wav";

  console.log(
    `Received ${fileEntry.filename} (${mimeType}, ${audioBuffer.length} bytes)`
  );

  const audioBase64 = audioBuffer.toString("base64");

  // Resolve parentPageId via pages.get
  console.log("Parent page title" + parentPageTitle);
  let parentPageId: string;
  try {
    const pages = await $fetch("/api/ntn/pages/get", {
      method: "POST",
      body: { apiKey: ntnApiKey, title: parentPageTitle },
    });
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Error(`Page titled "${parentPageTitle}" not found`);
    }
    parentPageId = pages[0].id;
    console.log("resolved parentPageId:", parentPageId);
  } catch (err: any) {
    console.error("lookup parentPageId failed:", err);
    setResponseStatus(event, 500);
    return { error: `Failed to find parent page: ${err.message}` };
  }

  processGemini(audioBase64, parentPageId, mimeType);

  // Prepare Gemini tools
  /*const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  const tools = [
    {
      functionDeclarations: [
        createNewPageFn,
        createAssignmentFn,
        updateAssignmentFn,
      ],
    },
  ];
  console.log(
    "tools:",
    tools[0].functionDeclarations.map((f) => f.name)
  );

  // Call Gemini with audio data
  let result: any;
  /*const config: any = {
    tools,
    toolChoice: "auto",
  };*/
  try {
    console.log("calling Gemini...");
    result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { text: "Decide which function to call based on this recording:" },
        { inlineData: { data: audioBase64, mimeType } },
      ],
      config: { tools },
    });
    console.log("raw response:", JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("Gemini error:", err);
    setResponseStatus(event, 500);
    return { error: "Gemini API call failed.", details: err.message };
  }

  console.log("functionCalls:", result.functionCalls);

  // Execute any function calls
  for (const call of result.functionCalls || []) {
    console.log(`call.name=${call.name}`, call.args);

    if (call.name === "createNewPage") {
      const title = call.args?.title || "Untitled Page";
      const content = call.args?.content || "No content provided";
      console.log("invoking createNewPage", { title, content });
      try {
        await $fetch("/api/ntn/pages/post", {
          method: "POST",
          body: { ntnApiKey, parentPageTitle, title, content },
        });
        console.log("createNewPage succeeded");
      } catch (err: any) {
        console.error("createNewPage failed:", err);
      }
    } else if (call.name === "createAssignment") {
      const { course, title, dueDate, taskTags } = call.args as any;

      const assignmentData = {
        course: course || "",
        title: title,
        dueDate: dueDate || new Date().toISOString().split("T")[0],
        taskTags: Array.isArray(taskTags) ? taskTags : [],
      };
      console.log("invoking createAssignment…", assignmentData);
      console.log("taskTags before addAssignment:", assignmentData.taskTags);
      try {
        const dbId = await ensureAssignmentsDatabase(ntnApiKey, parentPageId);
        await addAssignment(dbId, assignmentData, ntnApiKey);
        console.log("createAssignment succeeded");
      } catch (err: any) {
        console.error("createAssignment failed:", err);
      }
    } else if (call.name === "updateAssignment") {
      const { title, course, dueDate, taskTags, status } = call.args;

      try {
        const dbId = await ensureAssignmentsDatabase(ntnApiKey, parentPageId);
        const pageId = await findAssignmentPageId(ntnApiKey, dbId, title);

        await updateAssignment(ntnApiKey, dbId, title, {
          course,
          dueDate,
          taskTags,
          status,
        });

        console.log("updateAssignment succeeded");
      } catch (e: any) {
        console.error("updateAssignment failed:", e);
      }
    } else {
      console.warn("unknown function call", call.name);
    }
  }

  // Fallback: default to page creation if no calls
  if (!result.functionCalls?.length) {
    console.log("no function call — default createNewPage");
    try {
      await $fetch("/api/ntn/pages/post", {
        method: "POST",
        body: {
          ntnApiKey,
          parentPageTitle,
          title: "Untitled Page",
          content: "No content provided",
        },
      });
      console.log("default createNewPage succeeded");
    } catch (err: any) {
      console.error("default createNewPage failed:", err);
    }
  }*/

  setResponseStatus(event, 200);
  console.log("Process Audio end");
  return { message: "Audio processed successfully" };
});
