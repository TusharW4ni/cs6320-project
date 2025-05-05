import {
  defineEventHandler,
  readBody,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
import { GoogleGenAI } from "@google/genai";
import { ChromaClient } from "chromadb";

const chromaClient = new ChromaClient({
  path: "chroma_db_default_embeddings_google",
});

const runtimeConfig = useRuntimeConfig();
const ai = new GoogleGenAI({ apiKey: runtimeConfig.GOOGLE_API_KEY });

function extractCode(text: string): string | null {
  const codeBlockPattern = /```javascript\n([\s\S]*?)\n```/g;
  const match = codeBlockPattern.exec(text);
  return match ? match[1].trim() : null;
}

export default defineEventHandler(async (event) => {
  console.log("API: /api/gemini/generate-code/index.post.ts");

  let formData: any;
  try {
    formData = await readMultipartFormData(event);
  } catch (err: any) {
    console.error("readMultipartFormData failed:", err);
    setResponseStatus(event, 400);
    return { error: "Invalid multipart form data." };
  }
  const ntnApiKeyEntry = formData.find((f: any) => f.name === "ntnApiKey");

  if (!ntnApiKeyEntry || !ntnApiKeyEntry.data) {
    console.error("Notion API key missing");
    setResponseStatus(event, 400);
    return { error: "Notion API key not provided." };
  }

  const ntnApiKey = ntnApiKeyEntry.data.toString();

  const { prompt, notionApiKey } = await readBody(event);
  console.log(prompt);
  console.log(ntnApiKey);
  console.log(notionApiKey);

  /*if (!prompt) {
    console.error("Missing prompt");
    setResponseStatus(event, 400);
    return { error: "Missing prompt" };
  }

  // 1. Query Chroma
  let results;
  try {
    console.log("Querying Chroma...");
    const collection = await chromaClient.getCollection({
      name: "notion_api_docs_default_google",
    }); // Or your collection name
    results = await collection.query({
      queryTexts: [prompt],
      nResults: 3, // Adjust as needed
      //include: [documents],
    });
    console.log("Chroma results:", results);
  } catch (error: any) {
    console.error("Chroma query failed:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to query Chroma", details: error.message };
  }

  const context = results.documents.join("\n\n");

  const geminiPrompt = `You are a helpful assistant that can generate JavaScript code to interact with the Notion API. Use the following context to understand the user's request and generate code to fulfill it. Return ONLY the executable javascript code, do not include any other text or explanations.

Context:
${context}

User Request: ${prompt}
`;

  let geminiResponse;
  try {
    console.log("Prompting Gemini...");
    geminiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ text: geminiPrompt }],
    });
    console.log("Gemini response:", geminiResponse);
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    setResponseStatus(event, 500);
    return { error: "Gemini API call failed", details: error.message };
  }

  console.log(geminiResponse);

  const responseText =
    geminiResponse.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const codeToExecute = extractCode(responseText);

  if (!codeToExecute) {
    console.warn("Gemini did not generate any executable code.");
    setResponseStatus(event, 200); // Or maybe 400, depending on your desired behavior
    return {
      success: false,
      message: "Gemini did not generate any executable code.",
      geminiResponse: responseText,
    };
  }

  let executionResult;
  try {
    console.log("Executing generated code:", codeToExecute);
    const notion = new Client();
    executionResult = await eval(codeToExecute);
    console.log("Code execution result:", executionResult);
  } catch (e: any) {
    console.error("Error executing generated code:", e);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "Error executing generated code.",
      error: e.message,
      code: codeToExecute,
      geminiResponse: responseText,
    };
  }

  setResponseStatus(event, 200);
  console.log("API call successful.");
  return {
    success: true,
    result: executionResult,
    code: codeToExecute,
    geminiResponse: responseText,
  };*/
});
