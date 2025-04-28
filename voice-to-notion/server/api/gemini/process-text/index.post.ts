// server/api/gemini/process-text/index.post.ts
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { GoogleGenAI } from "@google/genai";
import { createNewPageFn, createAssignmentFn } from "~/server/lib/notion-tools";
import { ensureAssignmentsDatabase, addAssignment } from "~/server/lib/notion";

export default defineEventHandler(async (event) => {
  console.log("🚀 [process-text] start");

  const { GEMINI_KEY } = useRuntimeConfig();
  if (!GEMINI_KEY) {
    console.error("❌ [process-text] GEMINI_KEY not set");
    setResponseStatus(event, 500);
    return { error: "Gemini API key not configured." };
  }

  let body: any;
  try {
    body = await readBody(event);
    console.log("📥 [process-text] body:", body);
  } catch (e: any) {
    console.error("❌ [process-text] readBody failed:", e);
    setResponseStatus(event, 400);
    return { error: "Invalid request body." };
  }

  const { textPrompt, ntnApiKey, parentPageTitle } = body;
  if (!textPrompt || !ntnApiKey || !parentPageTitle) {
    console.error("❌ [process-text] Missing fields:", { textPrompt, ntnApiKey, parentPageTitle });
    setResponseStatus(event, 400);
    return { error: "Missing textPrompt, ntnApiKey or parentPageTitle." };
  }

  // Lookup the parent page ID via existing pages.get endpoint
  let parentPageId: string;
  try {
    const pages = await $fetch('/api/ntn/pages/get', {
      method: 'POST',
      body: { apiKey: ntnApiKey, title: parentPageTitle }
    });
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Error(`Page titled "${parentPageTitle}" not found`);
    }
    parentPageId = pages[0].id;
    console.log('ℹ️ [process-text] resolved parentPageId:', parentPageId);
  } catch (e: any) {
    console.error('❌ [process-text] lookup parentPageId failed:', e);
    setResponseStatus(event, 500);
    return { error: `Failed to find parent page: ${e.message}` };
  }

  console.log(`✉️ [process-text] prompt: "${textPrompt}"`);

  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  const tools = [{ functionDeclarations: [createNewPageFn, createAssignmentFn] }];
  console.log("🛠️ [process-text] tools:", tools[0].functionDeclarations.map(f => f.name));

  let result: any;
  try {
    console.log("📤 [process-text] calling Gemini…");
    result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { text: "Decide which function to call based on this text prompt:" },
        { text: textPrompt }
      ],
      config: { tools }
    });
    console.log("📥 [process-text] raw response:", JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error("❌ [process-text] Gemini error:", e);
    setResponseStatus(event, 500);
    return { error: "Gemini API call failed.", details: e.message };
  }

  console.log("ℹ️ [process-text] functionCalls:", result.functionCalls);

  // Handle function calls
  for (const call of result.functionCalls || []) {
    console.log(`🔔 [process-text] call.name=${call.name}`, call.args);

    if (call.name === "createNewPage") {
      const title = call.args?.title || "Untitled Page";
      const content = call.args?.content || "No content provided";
      console.log("📄 [process-text] invoking createNewPage…", { title, content });
      try {
        await $fetch("/api/ntn/pages/post", {
          method: "POST",
          body: { ntnApiKey, parentPageTitle, title, content }
        });
        console.log("✅ [process-text] createNewPage succeeded");
      } catch (e: any) {
        console.error("❌ [process-text] createNewPage failed:", e);
      }

    } else if (call.name === "createAssignment") {
      const { course, title, dueDate, taskTags } = call.args as any;
      console.log("🏷️ [process-text] invoking createAssignment…", { course, title, dueDate, taskTags });
      try {
        const dbId = await ensureAssignmentsDatabase(ntnApiKey, parentPageId);
        await addAssignment(dbId, { course, title, dueDate, taskTags }, ntnApiKey);
        console.log("✅ [process-text] createAssignment succeeded");
      } catch (e: any) {
        console.error("❌ [process-text] createAssignment failed:", e);
      }

    } else {
      console.warn("⚠️ [process-text] unknown function call:", call.name);
    }
  }

  // Fallback: if no functionCalls, default to page creation
  if (!result.functionCalls?.length) {
    console.log("📄 [process-text] no function call — default createNewPage");
    try {
      await $fetch("/api/ntn/pages/post", {
        method: "POST",
        body: { ntnApiKey, parentPageTitle, title: "Untitled Page", content: "No content provided" }
      });
      console.log("✅ [process-text] default createNewPage succeeded");
    } catch (e: any) {
      console.error("❌ [process-text] default createNewPage failed:", e);
    }
  }

  setResponseStatus(event, 200);
  console.log("🏁 [process-text] end");
  return { message: "Done" };
});
