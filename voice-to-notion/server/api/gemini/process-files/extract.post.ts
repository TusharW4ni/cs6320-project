import { defineEventHandler, readBody, H3Event } from "h3";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "fs";
import path from "path";

export default defineEventHandler(async (event: H3Event) => {
  const runtimeConfig = useRuntimeConfig();
  // Initialize Gemini AI client with API key from environment
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

    // Prepare contents array: initial prompt + each file's inline data
    const contents: any[] = [];
    contents.push({
      text: prompt || "Please summarize the following documents.",
    });

    for (const filename of filenames) {
      const safeName = path.basename(filename);
      const filePath = path.join(uploadsDir, safeName);
      const fileBuffer = await fs.readFile(filePath);
      const dataBase64 = fileBuffer.toString("base64");

      // Determine MIME type based on extension
      const ext = path.extname(safeName).toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === ".pdf") mimeType = "application/pdf";
      // else if (ext === ".txt") mimeType = "text/plain";
      // else if (ext === ".docx")
      //   mimeType =
      //     "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      contents.push({
        inlineData: { mimeType, data: dataBase64 },
      });
    }

    // Call Gemini model with batched contents
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
    });

    // Return the combined summary
    return { summary: response.text, raw: response };
  } catch (err: any) {
    return {
      error: err.message || "An error occurred while summarizing files.",
    };
  }
});
