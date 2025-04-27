import fs from "fs";
import path from "path";
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
    const formData = await readMultipartFormData(event);

    if (!formData) {
      console.error("Could not read multipart form data.");
      setResponseStatus(event, 400);
      return { error: "Invalid form data received." };
    }

    const fileEntry = formData.find((field) => field.name === "file");
    const ntnApiKeyEntry = formData.find((field) => field.name === "ntnApiKey");
    const parentPageTitleEntry = formData.find(
      (field) => field.name === "parentPageTitle"
    );

    if (!fileEntry || !fileEntry.data) {
      console.error("Audio file part not found in form data.");
      setResponseStatus(event, 400);
      return { error: "Audio file not found in the request." };
    } else if (!ntnApiKeyEntry || !ntnApiKeyEntry.data) {
      console.error("Notion API key part not found in form data.");
      setResponseStatus(event, 400);
      return { error: "Notion API key not found in the request." };
    } else if (!parentPageTitleEntry || !parentPageTitleEntry.data) {
      console.error("Parent page title part not found in form data.");
      setResponseStatus(event, 400);
      return { error: "Parent page title not found in the request." };
    }

    const ntnApiKey = ntnApiKeyEntry.data.toString();
    const parentPageTitle = parentPageTitleEntry.data.toString();
    const audioBuffer = fileEntry.data;
    const mimeType = fileEntry.type || "audio/wav";

    if (!audioBuffer || audioBuffer.length === 0) {
      console.error("Uploaded audio file is empty.");
      setResponseStatus(event, 400);
      return { error: "Uploaded audio file is empty." };
    }

    console.log(
      `Received file: ${fileEntry.filename} (${mimeType}, ${audioBuffer.length} bytes)`
    );

    // // --- Debugging file saving (commented out) ---
    // const tempDir = path.join(process.cwd(), "temp_audio");
    // if (!fs.existsSync(tempDir)) {
    //   fs.mkdirSync(tempDir);
    // }
    // const tempFilePath = path.join(
    //   tempDir,
    //   fileEntry.filename || "temp_audio.wav"
    // );
    // try {
    //   fs.writeFileSync(tempFilePath, audioBuffer);
    //   console.log(`Saved temporary file: ${tempFilePath}`);
    // } catch (saveError) {
    //   console.error("Error saving temporary file:", saveError);
    // }
    // // --- End of debugging block ---

    const audioBase64 = audioBuffer.toString("base64");

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
        { text: "Decide which function to call based on this recording:" },
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType,
          },
        },
      ],
      config: {
        tools,
      },
    });

    result.functionCalls?.map(async (functionCall) => {
      if (functionCall.name === "createNewPage") {
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
    return { message: "Audio processed successfully" };
  } catch (error: any) {
    console.error("Error processing audio or calling Gemini API:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to process audio.",
      details: error.message,
    };
  }
});
