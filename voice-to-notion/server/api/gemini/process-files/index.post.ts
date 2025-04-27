import { GoogleGenAI, createPartFromUri } from "@google/genai";
import { extname } from "path";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

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

    if (!fileEntry || !fileEntry.data) {
      console.error("File part not found in form data.");
      setResponseStatus(event, 400);
      return { error: "File not found in the request." };
    }

    let fileBuffer = fileEntry.data;
    let mimeType = fileEntry.type || "application/octet-stream";
    const fileExtension = extname(fileEntry.filename || "").toLowerCase();

    console.log(
      `Received file: ${fileEntry.filename} (${mimeType}, ${fileBuffer.length} bytes)`
    );

    if (![".pdf", ".doc", ".docx"].includes(fileExtension)) {
      console.error("Unsupported file type.");
      setResponseStatus(event, 400);
      return { error: "Only PDF, DOC, and DOCX files are supported." };
    }

    // Convert DOC/DOCX to PDF if necessary
    if ([".doc", ".docx"].includes(fileExtension)) {
      const tempInputPath = `./temp_input${fileExtension}`;
      const tempOutputPath = `./temp_output.pdf`;

      writeFileSync(tempInputPath, fileBuffer);

      try {
        execSync(
          `soffice --headless --convert-to pdf ${tempInputPath} --outdir ./`
        );
        fileBuffer = readFileSync(tempOutputPath);
        mimeType = "application/pdf";

        console.log("File converted to PDF successfully.");
      } catch (conversionError) {
        console.error("Error converting file to PDF:", conversionError);
        setResponseStatus(event, 500);
        return { error: "Failed to convert file to PDF." };
      }
    }

    const fileBlob = new Blob([fileBuffer], { type: mimeType });

    const file = await ai.files.upload({
      file: fileBlob,
      config: {
        displayName: fileEntry.filename || "Uploaded Document",
      },
    });

    // Wait for the file to be processed.
    let getFile = await ai.files.get({ name: file.name });
    while (getFile.state === "PROCESSING") {
      getFile = await ai.files.get({ name: file.name });
      console.log(`current file status: ${getFile.state}`);
      console.log("File is still processing, retrying in 5 seconds");

      await new Promise((resolve) => {
        setTimeout(resolve, 5000);
      });
    }

    if (getFile.state === "FAILED") {
      throw new Error("File processing failed.");
    }

    const content = [
      "Summarize the content of this document:",
      createPartFromUri(getFile.uri, getFile.mimeType),
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: content,
    });

    console.log("Summary result:", response.text);
    setResponseStatus(event, 200);
    return { message: "File summarized successfully", summary: response.text };
  } catch (error: any) {
    console.error("Error processing file or calling Gemini API:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to process file or summarize content.",
      details: error.message,
    };
  }
});
