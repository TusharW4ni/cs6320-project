import { GoogleGenAI, Type } from "@google/genai";
import { promises as fs } from "fs";
import path from "path";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const ai = new GoogleGenAI({ apiKey: runtimeConfig.GEMINI_KEY });
  try {
    // Optional prompt from request body
    const { prompt } = await readBody<{ prompt?: string }>(event);

    const uploadsDir = path.join(process.cwd(), "uploads");
    const filenames = await fs.readdir(uploadsDir);
    if (filenames.length === 0) {
      return { error: "No files found in uploads folder." };
    }

    const summaries: Record<string, string> = {};

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        course_number: {
          type: Type.STRING,
          description: "Course number of the course. For eg. CS6320",
          nullable: false,
        },
        course_section_number: {
          type: Type.STRING,
          description: "Course section number of the course. For eg. 001",
          nullable: false,
        },
        course_name: {
          type: Type.STRING,
          description: "Course name of the course. For eg. Computer Science",
          nullable: false,
        },
        professor_name: {
          type: Type.STRING,
          description: "Professor name of the course. For eg. John Doe",
          nullable: false,
        },
        professor_email: {
          type: Type.STRING,
          description:
            "Professor email of the course. For eg. xxx0000000@utdallas.edu",
          nullable: false,
        },
        professor_office_hours: {
          type: Type.STRING,
          description:
            "Professor office hours of the course. For eg. Monday 2-4pm",
          nullable: true,
        },
        professor_office_location: {
          type: Type.STRING,
          description:
            "Professor office location of the course. For eg. ECSN 2.210",
          nullable: false,
        },
        course_timing: {
          type: Type.STRING,
          description: "Course timing of the course. For eg. MW 2-4pm",
          nullable: false,
        },
        class_location: {
          type: Type.STRING,
          description: "Class location of the course. For eg. ECSN 2.210",
          nullable: false,
        },
        required_textbooks: {
          type: Type.STRING,
          description:
            "Comma separated list of required textbooks of the course.",
          nullable: false,
        },
        exam_dates: {
          type: Type.STRING,
          description:
            "Comma separated list of exam dates of the course. For eg. Midterm 1: 2023-10-01, Midterm 2: 2023-11-01",
          nullable: false,
        },
        exam_format: {
          type: Type.STRING,
          description: "Exam format of the course. For eg. Open book",
          nullable: false,
        },
        weightage: {
          type: Type.STRING,
          description:
            "Weightage of the course. For eg. 30% Midterm, 30% Final, 40% Assignments",
          nullable: false,
        },
      },
    };

    for (const filename of filenames) {
      const safeName = path.basename(filename);
      const filePath = path.join(uploadsDir, safeName);
      const fileBuffer = await fs.readFile(filePath);
      const dataBase64 = fileBuffer.toString("base64");

      // Determine MIME type based on extension
      const ext = path.extname(safeName).toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === ".pdf") mimeType = "application/pdf";

      const contents: any[] = [
        {
          text: prompt
            ? `${prompt} (File: ${safeName})`
            : `Extract the required information from this document, if no suitable value to fill a key put a hyphen "-": ${safeName}.`,
        },
        {
          inlineData: { mimeType, data: dataBase64 },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      try {
        summaries[safeName] = JSON.parse(response.text ?? "{}");
      } catch (e) {
        console.error(`Failed to parse response for ${safeName}`, e);
        summaries[safeName] = "{}";
      }
    }

    // save summaries to a file in notes directory
    const summariesFilePath = path.join(process.cwd(), "/notes/summaries.json");
    await fs.writeFile(summariesFilePath, JSON.stringify(summaries, null, 2));
    console.log(`Summaries saved to ${summariesFilePath}`);

    // Return all summaries as a JSON object
    return { summaries };
  } catch (err: any) {
    return {
      error: err.message || "An error occurred while summarizing files.",
    };
  }
});
