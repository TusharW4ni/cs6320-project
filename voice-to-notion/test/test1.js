import { GoogleGenAI } from "@google/genai";
import { ChromaClient, GoogleGenerativeAiEmbeddingFunction } from "chromadb";

/*const chromaClient = new ChromaClient({
  path: "/Users/maunika/Desktop/Spring_2025/CS_6320/cs6320-project/scraping-notion-docs/chroma_db_default_embeddings_google",
});*/
const chromaClient = new ChromaClient();
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAV78tO-c4G5fav6dgHcTYAvSRf2-eixgs",
});
const embedder = new GoogleGenerativeAiEmbeddingFunction({
  googleApiKey: "AIzaSyAV78tO-c4G5fav6dgHcTYAvSRf2-eixgs",
});

function extractCode(text) {
  const codeBlockPattern = /```javascript\n([\s\S]*?)\n```/g;
  const match = codeBlockPattern.exec(text);
  return match ? match[1].trim() : null;
}

let main = async () => {
  console.log("API: /api/gemini/generate-code/index.post.ts");

  /*let prompt =
    "Update the title of this database to 'Assignments'. The database id is 1ead52e75c848039af5fed608bfc8785";*/

  /*let prompt =
    "Create a property of type Select with name 'Course'. The database id is 1ead52e75c848039af5fed608bfc8785";*/

  /*let prompt =
    "Add options to the property named 'Course'. The options are '1234', '2345', '3456'. The database id is 1ead52e75c848039af5fed608bfc8785";*/

  let prompt =
    "create a new page named test1. The parent page id is 1e3d52e75c8480549cfff26d674d0295";

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
  } catch (error) {
    console.error("Chroma query failed:", error);
    return { error: "Failed to query Chroma", details: error.message };
  }
  const context = results.documents.join("\n\n");

  const geminiPrompt = `You are a helpful assistant that can generate JavaScript code to interact with the Notion Rest API (do not use Javascript Notion library). Use the following context to understand the user's request and generate code to fulfill it. Return ONLY the executable javascript code, do not use import or require statements assume that they're already imported, do not include any other text or explanations. Notion token is provided as an environment NOTION_API_KEY variable.

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
  } catch (error) {
    console.error("Gemini API call failed:", error);
    setResponseStatus(event, 500);
    return { error: "Gemini API call failed", details: error.message };
  }

  console.log(geminiResponse);

  const responseText = geminiResponse.candidates[0].content.parts[0].text || "";
  const codeToExecute = extractCode(responseText);
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

main();
