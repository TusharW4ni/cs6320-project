// server/api/gemini/process-files/extract.post.ts
import fs from "fs";
import path from "path";
import { createPartFromUri, GoogleGenAI } from "@google/genai";
import { defineEventHandler, readBody, useRuntimeConfig } from "h3";

export default defineEventHandler(async (event) => {
  // 1️⃣ Parse input
  const { paths } = await readBody(event);
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("Please provide an array of PDF file paths in ‘paths’.");
  }

  // 2️⃣ Init Gemini client
  const ai = new GoogleGenAI({ apiKey: useRuntimeConfig().GEMINI_KEY });

  // 3️⃣ Upload + wait helper, now with mimeType
  async function uploadAndWait(filePath: string) {
    const displayName = path.basename(filePath);
    // Tell Gemini it’s a PDF!
    const file = await ai.files.upload({
      // You can pass the path string directly; SDK will stream under the hood
      file: filePath,
      config: {
        displayName,
        mimeType: "application/pdf",
      },
    });
    // Poll until ready
    let meta = await ai.files.get({ name: file.name });
    while (meta.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 5_000));
      meta = await ai.files.get({ name: file.name });
    }
    if (meta.state !== "READY") {
      throw new Error(`Failed to process ${displayName}`);
    }
    return createPartFromUri(meta.uri, meta.mimeType);
  }

  // 4️⃣ Do all uploads in parallel
  const parts = await Promise.all(paths.map(uploadAndWait));

  // 5️⃣ Build your single summarize call
  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ text: "Summarize these PDFs:" }, ...parts],
  });

  return { summary: res.text };
});
