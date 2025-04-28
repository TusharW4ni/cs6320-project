import { defineEventHandler, readBody, H3Event } from "h3";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "fs";
import path from "path";

// Initialize Gemini AI client with API key from environment

export default defineEventHandler(async (event: H3Event) => {
  const runtimeConfig = useRuntimeConfig();
  const ai = new GoogleGenAI({ apiKey: runtimeConfig.GEMINI_KEY });
  try {
    // Optional prompt from request body
    const { prompt } = await readBody<{ prompt?: string }>(event);

    // Directory containing uploaded files
    const uploadsDir = path.join(process.cwd(), "uploads");

    // Read all filenames in uploads folder
    const filenames = await fs.readdir(uploadsDir);
    if (filenames.length === 0) {
      return { error: "No files found in uploads folder." };
    }

    // Object to hold summaries per file
    const summaries: Record<string, string> = {};

    // Process each file one at a time
    for (const filename of filenames) {
      const safeName = path.basename(filename);
      const filePath = path.join(uploadsDir, safeName);
      const fileBuffer = await fs.readFile(filePath);
      const dataBase64 = fileBuffer.toString("base64");

      // Determine MIME type based on extension
      const ext = path.extname(safeName).toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === ".pdf") mimeType = "application/pdf";
      else if (ext === ".txt") mimeType = "text/plain";
      else if (ext === ".docx")
        mimeType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      // Prepare Gemini payload for this single file
      const contents: any[] = [
        {
          text: prompt
            ? `${prompt} (File: ${safeName})`
            : `Please summarize the following document: ${safeName}`,
        },
        {
          inlineData: { mimeType, data: dataBase64 },
        },
      ];

      // Call Gemini model
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
      });

      // Store the summary under the filename key
      summaries[safeName] = response.text;
    }

    // Return all summaries as a JSON object
    return { summaries };
  } catch (err: any) {
    return {
      error: err.message || "An error occurred while summarizing files.",
    };
  }
});
