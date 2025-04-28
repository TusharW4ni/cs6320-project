// server/api/gemini/process-audio/index.post.ts
import { defineEventHandler, readMultipartFormData, setResponseStatus } from 'h3';
import { GoogleGenAI } from '@google/genai';
import { createNewPageFn, createAssignmentFn } from '~/server/lib/notion-tools';
import { ensureAssignmentsDatabase, addAssignment } from '~/server/lib/notion';

export default defineEventHandler(async (event) => {
  console.log('🚀 [process-audio] start');

  const { GEMINI_KEY } = useRuntimeConfig();
  if (!GEMINI_KEY) {
    console.error('❌ [process-audio] GEMINI_KEY not set');
    setResponseStatus(event, 500);
    return { error: 'Gemini API key not configured.' };
  }

  let formData: any;
  try {
    formData = await readMultipartFormData(event);
  } catch (err: any) {
    console.error('❌ [process-audio] readMultipartFormData failed:', err);
    setResponseStatus(event, 400);
    return { error: 'Invalid multipart form data.' };
  }

  const fileEntry = formData.find((f: any) => f.name === 'file');
  const ntnApiKeyEntry = formData.find((f: any) => f.name === 'ntnApiKey');
  const parentTitleEntry = formData.find((f: any) => f.name === 'parentPageTitle');

  if (!fileEntry || !fileEntry.data) {
    console.error('❌ [process-audio] Audio file missing');
    setResponseStatus(event, 400);
    return { error: 'Audio file not found.' };
  }
  if (!ntnApiKeyEntry || !ntnApiKeyEntry.data) {
    console.error('❌ [process-audio] Notion API key missing');
    setResponseStatus(event, 400);
    return { error: 'Notion API key not provided.' };
  }
  if (!parentTitleEntry || !parentTitleEntry.data) {
    console.error('❌ [process-audio] Parent page title missing');
    setResponseStatus(event, 400);
    return { error: 'Parent page title not provided.' };
  }

  const ntnApiKey = ntnApiKeyEntry.data.toString();
  const parentPageTitle = parentTitleEntry.data.toString();
  const audioBuffer = fileEntry.data;
  const mimeType = fileEntry.type || 'audio/wav';

  console.log(`📥 [process-audio] Received ${fileEntry.filename} (${mimeType}, ${audioBuffer.length} bytes)`);

  const audioBase64 = audioBuffer.toString('base64');

  // Resolve parentPageId via pages.get
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
    console.log('ℹ️ [process-audio] resolved parentPageId:', parentPageId);
  } catch (err: any) {
    console.error('❌ [process-audio] lookup parentPageId failed:', err);
    setResponseStatus(event, 500);
    return { error: `Failed to find parent page: ${err.message}` };
  }

  // Prepare Gemini tools
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  const tools = [
    { functionDeclarations: [createNewPageFn, createAssignmentFn] }
  ];
  console.log('🛠️ [process-audio] tools:', tools[0].functionDeclarations.map(f => f.name));

  // Call Gemini with audio data
  let result: any;
  try {
    console.log('📤 [process-audio] calling Gemini...');
    result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { text: 'Decide which function to call based on this recording:' },
        { inlineData: { data: audioBase64, mimeType } }
      ],
      config: { tools }
    });
    console.log('📥 [process-audio] raw response:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('❌ [process-audio] Gemini error:', err);
    setResponseStatus(event, 500);
    return { error: 'Gemini API call failed.', details: err.message };
  }

  console.log('ℹ️ [process-audio] functionCalls:', result.functionCalls);

  // Execute any function calls
  for (const call of result.functionCalls || []) {
    console.log(`🔔 [process-audio] call.name=${call.name}`, call.args);

    if (call.name === 'createNewPage') {
      const title = call.args?.title || 'Untitled Page';
      const content = call.args?.content || 'No content provided';
      console.log('📄 [process-audio] invoking createNewPage', { title, content });
      try {
        await $fetch('/api/ntn/pages/post', {
          method: 'POST',
          body: { ntnApiKey, parentPageTitle, title, content }
        });
        console.log('✅ [process-audio] createNewPage succeeded');
      } catch (err: any) {
        console.error('❌ [process-audio] createNewPage failed:', err);
      }

    } else if (call.name === 'createAssignment') {
      const { course, title, dueDate, taskTags } = call.args as any;
      console.log('🏷️ [process-audio] invoking createAssignment', { course, title, dueDate, taskTags });
      try {
        const dbId = await ensureAssignmentsDatabase(ntnApiKey, parentPageId);
        await addAssignment(dbId, { course, title, dueDate, taskTags }, ntnApiKey);
        console.log('✅ [process-audio] createAssignment succeeded');
      } catch (err: any) {
        console.error('❌ [process-audio] createAssignment failed:', err);
      }

    } else {
      console.warn('⚠️ [process-audio] unknown function call', call.name);
    }
  }

  // Fallback: default to page creation if no calls
  if (!result.functionCalls?.length) {
    console.log('📄 [process-audio] no function call — default createNewPage');
    try {
      await $fetch('/api/ntn/pages/post', {
        method: 'POST',
        body: { ntnApiKey, parentPageTitle, title: 'Untitled Page', content: 'No content provided' }
      });
      console.log('✅ [process-audio] default createNewPage succeeded');
    } catch (err: any) {
      console.error('❌ [process-audio] default createNewPage failed:', err);
    }
  }

  setResponseStatus(event, 200);
  console.log('🏁 [process-audio] end');
  return { message: 'Audio processed successfully' };
});