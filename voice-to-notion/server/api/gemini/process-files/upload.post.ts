import { extname, join } from "path";
import path from "path";
import { renameSync, mkdirSync, existsSync, readdirSync, unlinkSync } from "fs";
import formidable from "formidable";
import ILovePDFApi from "@ilovepdf/ilovepdf-nodejs";
import ILovePDFFile from "@ilovepdf/ilovepdf-nodejs/ILovePDFFile";
import fs from "fs";
import { GoogleGenAI, createPartFromUri } from "@google/genai";

function clearUploads(directory: string) {
  try {
    const files = readdirSync(directory);
    for (const file of files) {
      const filePath = join(directory, file);
      unlinkSync(filePath);
    }
    console.log("Uploads directory cleared.");
  } catch (error) {
    console.error("Error clearing uploads directory:", error);
  }
}

async function uploadPDFToGemini(
  ai: GoogleGenAI,
  pdfPath: string,
  displayName: string
) {
  const pdfBuffer = await fetch(pdfPath).then((res) => res.arrayBuffer());
  const fileBlob = new Blob([pdfBuffer], { type: "application/pdf" });
  const file = await ai.files.upload({
    file: fileBlob,
    config: {
      displayName,
    },
  });

  let getFile = await ai.files.get({ name: file.name || "" });
  while (getFile.state === "PROCESSING") {
    getFile = await ai.files.get({ name: file.name || "" });
    console.log(`current file status: ${getFile.state}`);
    console.log("File is still processing, retrying in 5 seconds");

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }
  if (file.state === "FAILED") {
    throw new Error("File processing failed.");
  }

  return file;
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const ilpPublicKey = runtimeConfig.ILOVEPDF_PUBLIC_KEY;
  const ilpPrivateKey = runtimeConfig.ILOVEPDF_PRIVATE_KEY;
  const ilovepdf = new ILovePDFApi(ilpPublicKey, ilpPrivateKey);
  const task = ilovepdf.newTask("officepdf");

  try {
    const uploadDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir);
    }

    clearUploads(uploadDir);

    const form = formidable({
      multiples: true,
      uploadDir: uploadDir,
      keepExtensions: true,
    });

    const { files } = await new Promise<{ files: formidable.Files }>(
      (resolve, reject) => {
        form.parse(event.node.req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ files });
        });
      }
    );

    const savedFiles: string[] = [];
    for (const fileKey in files) {
      const fileOrFiles = files[fileKey];
      const fileArray = Array.isArray(fileOrFiles)
        ? fileOrFiles
        : [fileOrFiles];
      for (const file of fileArray) {
        if (!file) {
          console.error(`File is undefined for key: ${fileKey}`);
          continue;
        }
        const originalFilename =
          file.originalFilename || file.newFilename || `file_${Date.now()}`;
        const newFilePath = join(uploadDir, originalFilename);
        if (file.filepath) {
          renameSync(file.filepath, newFilePath);
          savedFiles.push(newFilePath);
        } else {
          console.error(`Filepath is undefined for file: ${originalFilename}`);
        }
      }
    }

    // savedFiles.forEach(async (file) => {
    //   if (extname(file) === ".doc" || extname(file) === ".docx") {
    //     await task
    //       .start()
    //       .then(() => {
    //         const docFile = new ILovePDFFile(file);
    //         return task.addFile(docFile);
    //       })
    //       .then(() => {
    //         return task.process();
    //       })
    //       .then(() => {
    //         return task.download();
    //       })
    //       .then((data) => {
    //         unlinkSync(file);
    //         fs.writeFileSync(`uploads/converted${Date.now()}.pdf`, data);
    //       });
    //   }
    // });
    // const ai = new GoogleGenAI({ apiKey: runtimeConfig.GOOGLE_API_KEY });
    //get all files in the uploads directory
    // const filesInUploads = readdirSync(uploadDir);
    // const content = ["summarize this document"];
    // console.log("Files in uploads:", filesInUploads);
    // filesInUploads.forEach(async (file) => {
    //   const f = await uploadPDFToGemini(ai, join(uploadDir, file), file);
    //   if (f.uri && f.mimeType) {
    //     const fContent = createPartFromUri(f.uri, f.mimeType);
    //     content.push(fContent);
    //   }
    // });
    // const response = await ai.models.generateContent({
    //   model: "gemini-2.0-flash",
    //   contents: content,
    // });

    // console.log("Response from AI:", response);

    // console.log("content:", content);

    const processingTasks = savedFiles.map(async (file) => {
      if (extname(file) === ".doc" || extname(file) === ".docx") {
        await task
          .start()
          .then(() => {
            const docFile = new ILovePDFFile(file);
            return task.addFile(docFile);
          })
          .then(() => {
            return task.process();
          })
          .then(() => {
            return task.download();
          })
          .then((data) => {
            unlinkSync(file); // Delete the original file
            fs.writeFileSync(`uploads/converted${Date.now()}.pdf`, data); // Save the converted PDF
          });
      }
    });

    // Wait for all processing tasks to complete
    await Promise.all(processingTasks);

    const paths: any = [];
    const dirPath = path.join(process.cwd(), "uploads");
    const f = fs.readdirSync(dirPath);
    f.forEach((file) => {
      paths.push(path.join(dirPath, file));
    });

    setResponseStatus(event, 200);
    return { message: "Files uploaded successfully", paths };
  } catch (error: any) {
    console.error("Error processing file upload:", error);
    setResponseStatus(event, 500);
    return {
      error: "Failed to upload files.",
      details: error.message,
    };
  }
});
