import { GoogleGenAI } from "@google/genai";
import { extname, join } from "path";
import { renameSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "fs";
import formidable from "formidable";
import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs";
import ILovePDFFile from "@ilovepdf/ilovepdf-nodejs/ILovePDFFile";
import fs from "fs";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const apiKey = runtimeConfig.GEMINI_KEY;
  const ilpPublicKey = runtimeConfig.ILOVEPDF_PUBLIC_KEY;
  const ilpPrivateKey = runtimeConfig.ILOVEPDF_PRIVATE_KEY;
  const ilovepdf = new ILovePDFApi(ilpPublicKey, ilpPrivateKey);

  const task = ilovepdf.newTask("officepdf");

  if (!apiKey) {
    console.error("Gemini API key is not configured.");
    setResponseStatus(event, 500);
    return { error: "Gemini API key not configured on the server." };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    // Ensure the upload directory exists
    const uploadDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir);
    }

    // Clear the upload directory
    clearUploads(uploadDir);

    // Parse the incoming form data
    const form = formidable({
      multiples: true,
      uploadDir: uploadDir, // Save files directly to the upload directory
      keepExtensions: true, // Keep file extensions
    });

    const { files } = await new Promise<{ files: formidable.Files }>(
      (resolve, reject) => {
        form.parse(event.node.req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ files });
        });
      }
    );

    // Rename files to their original filenames
    const savedFiles: string[] = [];
    for (const fileKey in files) {
      const fileOrFiles = files[fileKey];

      // Handle both single file and array of files
      const fileArray = Array.isArray(fileOrFiles)
        ? fileOrFiles
        : [fileOrFiles];

      for (const file of fileArray) {
        if (!file) {
          console.error(`File is undefined for key: ${fileKey}`);
          continue; // Skip undefined files
        }

        const originalFilename =
          file.originalFilename || file.newFilename || `file_${Date.now()}`;
        const newFilePath = join(uploadDir, originalFilename);

        if (file.filepath) {
          renameSync(file.filepath, newFilePath); // Rename the file to its original name
          savedFiles.push(newFilePath);
        } else {
          console.error(`Filepath is undefined for file: ${originalFilename}`);
        }
      }
    }

    console.log("Files saved to server:", savedFiles);

    savedFiles.forEach((file) => {
      if (extname(file) === ".doc" || extname(file) === ".docx") {
        task
          .start()
          .then(() => {
            // console.log("Task started successfully.");
            const docFile = new ILovePDFFile(file);
            return task.addFile(docFile);
          })
          .then(() => {
            // console.log("File added to task successfully.");
            return task.process();
          })
          .then(() => {
            // console.log("Task processed successfully.");
            return task.download();
          })
          .then((data) => {
            // console.log("Task downloaded successfully.");
            unlinkSync(file);
            fs.writeFileSync("uploads/converted.pdf", data);
          });
      }
    });

    // upload

    setResponseStatus(event, 200);
    return { message: "Files uploaded successfully", files: savedFiles };
  } catch (error: any) {
    console.error("Error processing file upload:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to upload files.",
      details: error.message,
    };
  }
});

// Function to clear all files in the uploads directory
function clearUploads(directory: string) {
  try {
    const files = readdirSync(directory);
    for (const file of files) {
      const filePath = join(directory, file);
      unlinkSync(filePath); // Delete each file
    }
    console.log("Uploads directory cleared.");
  } catch (error) {
    console.error("Error clearing uploads directory:", error);
  }
}
