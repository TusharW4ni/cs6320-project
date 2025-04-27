import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";

interface Tools {
  functionDeclarations: FunctionDeclaration[];
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const apiKey = runtimeConfig.GEMINI_KEY;

  if (!apiKey) {
    console.error("Gemini API key is not configured.");
    setResponseStatus(event, 500);
    return { error: "Gemini API key not configured on the server." };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const { textPrompt, ntnApiKey, parentPageTitle } = await readBody(event);

    if (!textPrompt || !ntnApiKey || !parentPageTitle) {
      console.error("Missing required fields: textPrompt, ntnApiKey, or parentPageTitle.");
      setResponseStatus(event, 400);
      return { error: "Missing required fields: textPrompt, ntnApiKey, or parentPageTitle." };
    }

    console.log(`Received text prompt: "${textPrompt}"`);

    const tools: Tools[] = [
      {
        functionDeclarations: [
          {
            name: "createNewPage",
            description: "Create a new page in Notion when asked to do so",
            parameters: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: "The title of the page to create",
                },
                content: {
                  type: Type.STRING,
                  description: "The content of the page to create",
                },
              },
              required: ["title", "content"],
            },
          },
        ],
      },
    ];

    console.log("Sending data to Gemini API...");
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { text: "Decide which function to call based on this text prompt:" },
        { text: textPrompt },
      ],
      config: {
        tools,
      },
    });

    result.functionCalls?.map(async (functionCall) => {
      if (functionCall.name === "createNewPage") {
        console.log("Creating a new page in Notion...");
        await $fetch("/api/ntn/pages/post", {
          method: "POST",
          body: {
            ntnApiKey,
            parentPageTitle,
            title: functionCall.args?.title || "Untitled Page",
            content: functionCall.args?.content || "No content provided",
          },
        });
      }
    });

    setResponseStatus(event, 200);
    return { message: "Text processed successfully" };
  } catch (error: any) {
    console.error("Error processing text or calling Gemini API:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to process text.",
      details: error.message,
    };
  }
});