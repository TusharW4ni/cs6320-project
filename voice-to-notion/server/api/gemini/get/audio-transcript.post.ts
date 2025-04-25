import {
  defineEventHandler,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
// Import the new SDK
import { GoogleGenAI } from "@google/genai";
// Buffer is usually globally available in Node environments, but explicit import is fine.
// import { Buffer } from "buffer";

// The fs and path imports were for the temporary file saving debugging,
// which is commented out. You can keep them if you still need that for testing.
// import fs from "fs";
// import path from "path";

export default defineEventHandler(async (event) => {
  // Make sure your Gemini API key is configured in your Nuxt runtime config
  // Example in nuxt.config.ts:
  // runtimeConfig: {
  //   GEMINI_KEY: process.env.GEMINI_API_KEY // Ensure this matches your config
  // },
  const runtimeConfig = useRuntimeConfig();
  // Use the correct key name from your runtime config
  const apiKey = runtimeConfig.GEMINI_KEY;

  if (!apiKey) {
    console.error("Gemini API key is not configured.");
    setResponseStatus(event, 500);
    return { error: "Gemini API key not configured on the server." };
  }

  // Initialize with the new SDK class
  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    // 1. Read the multipart form data from the request
    const formData = await readMultipartFormData(event);

    if (!formData) {
      console.error("Could not read multipart form data.");
      setResponseStatus(event, 400);
      return { error: "Invalid form data received." };
    }

    // 2. Find the file part named "file"
    const fileEntry = formData.find((field) => field.name === "file");

    if (!fileEntry || !fileEntry.data) {
      console.error("Audio file part not found in form data.");
      setResponseStatus(event, 400);
      return { error: "Audio file not found in the request." };
    }

    // fileEntry.data is a Buffer containing the file content
    const audioBuffer = fileEntry.data;
    const mimeType = fileEntry.type || "audio/wav"; // Use the detected type or default

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

    // 3. Prepare the audio data for the Gemini API
    // Gemini's inlineData expects data as a base64 encoded string
    const audioBase64 = audioBuffer.toString("base64");

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType,
      },
    };

    // 4. Construct the contents array in the new format
    // It directly contains text and inlineData parts
    const contents = [
      { text: "Transcribe the following audio:" }, // Your instruction part
      audioPart, // Your audio data part
    ];

    // 5. Call the Gemini API using the new SDK method and contents structure
    console.log("Sending data to Gemini API...");
    // Call generateContent on ai.models and specify the model in options
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Use the model name from your example
      contents: contents, // Use the new contents array structure
    });

    // 6. Extract the response (the transcription) using the new access method
    const transcriptionText = await result.text; // Access text directly from result

    console.log("Transcription received from Gemini:", transcriptionText);

    // 7. Return the transcription to the frontend
    setResponseStatus(event, 200);
    return { transcript: transcriptionText };
  } catch (error: any) {
    console.error("Error processing audio or calling Gemini API:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to process audio or get transcription.",
      details: error.message,
    };
  }
});
