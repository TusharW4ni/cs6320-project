import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { GoogleGenAI } from "@google/genai";
import {
  createNewPageFn,
  createAssignmentFn,
  updateAssignmentFn,
} from "~/server/api/ntn/assignments/ai-functions";
import {
  ensureAssignmentsDatabase,
  addAssignment,
  updateAssignment,
  findAssignmentPageId,
} from "~/server/api/ntn/assignments/db-service";

export default defineEventHandler(async (event) => {
  console.log("Process Text start");

  const { GEMINI_KEY } = useRuntimeConfig();
  if (!GEMINI_KEY) {
    console.error("GEMINI_KEY not set");
    setResponseStatus(event, 500);
    return { error: "Gemini API key not configured." };
  }

  let body: any;
  try {
    body = await readBody(event);
    console.log("body:", body);
  } catch (e: any) {
    console.error("readBody failed:", e);
    setResponseStatus(event, 400);
    return { error: "Invalid request body." };
  }

  const { textPrompt, ntnApiKey, parentPageTitle } = body;
  if (!textPrompt || !ntnApiKey || !parentPageTitle) {
    console.error("Missing fields:", {
      textPrompt,
      ntnApiKey,
      parentPageTitle,
    });
    setResponseStatus(event, 400);
    return { error: "Missing textPrompt, ntnApiKey or parentPageTitle." };
  }

  // Lookup the parent page ID via existing pages.get endpoint
  let parentPageId: string;
  try {
    const pages = await $fetch("/api/ntn/pages/get", {
      method: "POST",
      body: { apiKey: ntnApiKey, title: parentPageTitle },
    });
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Error(`Page titled "${parentPageTitle}" not found`);
    }
    parentPageId = pages[0].id;
    console.log("Pages:", pages);
    console.log("resolved parentPageId:", parentPageId);
  } catch (e: any) {
    console.error("lookup parentPageId failed:", e);
    setResponseStatus(event, 500);
    return { error: `Failed to find parent page: ${e.message}` };
  }

  console.log(`prompt: "${textPrompt}"`);

  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  const tools = [
    {
      functionDeclarations: [
        createNewPageFn,
        createAssignmentFn,
        updateAssignmentFn,
      ],
    },
  ];
  console.log(
    "tools:",
    tools[0].functionDeclarations.map((f) => f.name)
  );

  let result: any;
  /*const config: any = {
    tools,
    toolChoice: "auto",
  };*/

  try {
    console.log("calling Gemini…");
    result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { text: "Decide which function to call based on this text prompt:" },
        { text: textPrompt },
      ],
      config: { tools },
    });
    console.log("raw response:", JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error("Gemini error:", e);
    setResponseStatus(event, 500);
    return { error: "Gemini API call failed.", details: e.message };
  }

  console.log("functionCalls:", result.functionCalls);

  // Handle function calls
  for (const call of result.functionCalls || []) {
    console.log(`call.name=${call.name}`, call.args);
    let dbId: string | undefined;

    if (call.name === "createNewPage") {
      const title = call.args?.title || "Untitled Page";
      const content = call.args?.content || "No content provided";
      console.log("invoking createNewPage…", { title, content });
      try {
        await $fetch("/api/ntn/pages/post", {
          method: "POST",
          body: { ntnApiKey, parentPageTitle, title, content },
        });
        console.log("createNewPage succeeded");
      } catch (e: any) {
        console.error("createNewPage failed:", e);
      }
    } else if (call.name === "createAssignment") {
      const { course, title, dueDate, taskTags } = call.args as any;

      const assignmentData = {
        course: course || "",
        title: title,
        dueDate: dueDate || new Date().toISOString().split("T")[0],
        taskTags: Array.isArray(taskTags) ? taskTags : [],
      };

      console.log("invoking createAssignment…", assignmentData);
      console.log("taskTags before addAssignment:", assignmentData.taskTags);
      try {
        const dbId = await ensureAssignmentsDatabase(ntnApiKey, parentPageId);
        await addAssignment(dbId, assignmentData, ntnApiKey);
        console.log("createAssignment succeeded");
      } catch (e: any) {
        console.error("createAssignment failed:", e);
      }
    } else if (call.name === "updateAssignment") {
      const { title, course, dueDate, taskTags, status } = call.args;

      try {
        const dbId = await ensureAssignmentsDatabase(ntnApiKey, parentPageId);
        const pageId = await findAssignmentPageId(ntnApiKey, dbId, title);

        await updateAssignment(ntnApiKey, dbId, title, {
          course,
          dueDate,
          taskTags,
          status,
        });

        console.log("updateAssignment succeeded");
      } catch (e: any) {
        console.error("updateAssignment failed:", e);
      }
    } else {
      console.warn("unknown function call:", call.name);
    }
  }

  // Fallback: if no functionCalls, default to page creation
  if (!result.functionCalls?.length) {
    console.log("No function call —> default to createNewPage");
    try {
      await $fetch("/api/ntn/pages/post", {
        method: "POST",
        body: {
          ntnApiKey,
          parentPageTitle,
          title: "Untitled Page",
          content: "No content provided",
        },
      });
      console.log("createNewPage succeeded");
    } catch (e: any) {
      console.error("createNewPage failed:", e);
    }
  }

  setResponseStatus(event, 200);
  console.log("Process Text end");
  return { message: "Done" };
});
