import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export default defineEventHandler(async (event) => {
  const { html } = await readBody(event);
  const { API_KEY } = useRuntimeConfig(event);

  const genAI = new GoogleGenerativeAI(API_KEY);

  const schema = {
    description: "Fetched recipe context from blog post",
    type: SchemaType.OBJECT,
    properties: {
      ingredients: {
        type: SchemaType.ARRAY,
        description: "Ingredients list",
        items: {
          type: SchemaType.STRING,
        },
      },
      steps: {
        type: SchemaType.ARRAY,
        description: "Recipe steps",
        items: {
          type: SchemaType.STRING,
        },
      },
      tips: {
        type: SchemaType.STRING,
        description: "Additional tips/notes",
      },
      // required: ["ingredients", "steps", "tips"],
    },
  };

  const model = genAI.getGenerativeModel({
    model: "models/gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const result = await model.generateContent([
    {
      inlineData: {
        data: Buffer.from(html).toString("base64"),
        mimeType: "text/html",
      },
    },
    "give me the ingredients list, recipe steps, and any additional tips/notes from this blog post. please do not include any '\n' in your answer.",
  ]);

  const recipeDetails = JSON.parse(result.response.text());

  const { ingredients, steps, tips } = recipeDetails;

  return { ingredients, steps, tips };
});
