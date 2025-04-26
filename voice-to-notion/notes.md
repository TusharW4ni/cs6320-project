Yes, you can structure your application to keep the actual APIs in separate files and use Gemini's function calling to determine which API to call. Here's how you can achieve this:

---

### 1. **Centralized Function Dispatcher**

You can create a centralized dispatcher that maps function names (e.g., `createNotionPage`) to specific API endpoints. Once Gemini determines the function to call, the dispatcher will redirect the request to the appropriate API.

---

### 2. **Backend: Centralized Dispatcher**

Create a centralized dispatcher API (e.g., `voice-to-notion/server/api/dispatcher.post.ts`) that handles the function call and redirects to the appropriate API.

```ts
import { defineEventHandler, readBody, setResponseStatus } from "h3";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.functionName || !body.parameters) {
    setResponseStatus(event, 400);
    return { error: "Invalid request. Missing functionName or parameters." };
  }

  const { functionName, parameters } = body;

  // Map function names to API endpoints
  const functionMap: Record<string, string> = {
    createNotionPage: "/api/notion/create-page",
    // Add more functions here as needed
  };

  const apiEndpoint = functionMap[functionName];
  if (!apiEndpoint) {
    setResponseStatus(event, 400);
    return { error: `Unknown function: ${functionName}` };
  }

  // Redirect to the appropriate API
  try {
    const response = await $fetch(apiEndpoint, {
      method: "POST",
      body: parameters,
    });
    return response;
  } catch (error) {
    console.error("Error calling API:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to call the API.", details: error.message };
  }
});
```

---

### 3. **Backend: Create Notion Page API**

Create a separate API file for creating a Notion page (e.g., `voice-to-notion/server/api/notion/create-page.post.ts`).

```ts
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const notionApiKey = runtimeConfig.NOTION_KEY;

  if (!notionApiKey) {
    setResponseStatus(event, 500);
    return { error: "Notion API key is not configured." };
  }

  const notion = new Client({ auth: notionApiKey });
  const body = await readBody(event);

  if (!body || !body.title) {
    setResponseStatus(event, 400);
    return { error: "Invalid request. Missing title." };
  }

  const { title } = body;

  try {
    const notionResponse = await notion.pages.create({
      parent: { database_id: "YOUR_DATABASE" }, // Replace with your Notion database ID
      properties: {
        Title: {
          title: [
            {
              text: { content: title },
            },
          ],
        },
      },
    });

    return { success: true, notionResponse };
  } catch (error) {
    console.error("Error creating Notion page:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to create Notion page.", details: error.message };
  }
});
```

---

### 4. **Backend: Gemini Integration**

Update your Gemini integration to call the dispatcher instead of directly handling the function logic.

```ts
import {
  defineEventHandler,
  readMultipartFormData,
  setResponseStatus,
} from "h3";
import { GoogleGenAI } from "@google/genai";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig();
  const geminiApiKey = runtimeConfig.GEMINI_KEY;

  if (!geminiApiKey) {
    setResponseStatus(event, 500);
    return { error: "Gemini API key is not configured." };
  }

  const gemini = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    // 1. Read the audio file from the request
    const formData = await readMultipartFormData(event);
    const fileEntry = formData?.find((field) => field.name === "file");
    if (!fileEntry || !fileEntry.data) {
      setResponseStatus(event, 400);
      return { error: "Audio file not found in the request." };
    }

    // 2. Transcribe the audio using Gemini
    const audioBase64 = fileEntry.data.toString("base64");
    const transcriptionResult = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          text: "Transcribe the following audio and determine the function to call:",
        },
        { inlineData: { data: audioBase64, mimeType: "audio/wav" } },
      ],
    });

    const transcriptionText = transcriptionResult.text;
    console.log("Transcription:", transcriptionText);

    // 3. Use Gemini to determine the function to call
    const functionCallResult = await gemini.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          text: `The user said: "${transcriptionText}". Determine the function to call and its parameters.`,
        },
      ],
      functions: [
        {
          name: "createNotionPage",
          description: "Create a new page in Notion",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "The title of the new Notion page",
              },
            },
            required: ["title"],
          },
        },
      ],
    });

    const functionCall = functionCallResult.functionCall;
    if (functionCall) {
      // 4. Redirect to the dispatcher
      const dispatcherResponse = await $fetch("/api/dispatcher", {
        method: "POST",
        body: {
          functionName: functionCall.name,
          parameters: functionCall.parameters,
        },
      });

      return dispatcherResponse;
    }

    return { error: "No valid function call was determined." };
  } catch (error) {
    console.error("Error:", error);
    setResponseStatus(event, 500);
    return { error: "Failed to process the request.", details: error.message };
  }
});
```

---

### 5. **Frontend: No Changes Needed**

The frontend remains the same as it sends the audio file to the `/api/gemini/get/audio-transcript` endpoint.

---

### 6. **Advantages of This Approach**

- **Separation of Concerns**: Each API handles a specific task, making the code modular and easier to maintain.
- **Scalability**: You can easily add more functions and APIs by updating the `functionMap` in the dispatcher.
- **Flexibility**: The dispatcher dynamically routes requests based on Gemini's function call output.

This setup ensures that your APIs are decoupled while still allowing Gemini to determine the appropriate action dynamically.
