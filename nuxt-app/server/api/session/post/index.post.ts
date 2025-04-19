import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const url = body.url;
  const userId = body.userId;

  try {
    if (await checkIfRecipeExists(url)) {
      setResponseStatus(event, 409);
      return { error: "Recipe already exists" };
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) {
      throw new Error(res.status);
    }
    let html = await res.text();
    function removeAllScriptTags(html: string) {
      // Remove <style> tags and their contents
      html = html.replace(
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        ""
      );

      // Remove style attributes directly within HTML elements
      html = html.replace(/style="[^"]*"/gi, "");

      // Remove any element with a style attribute
      html = html.replace(/<\w+\s+style=['"][^'"]*['"]\s*>/gi, "");

      return html;
    }
    html = removeAllScriptTags(html);

    // ==============================================================

    // const { html } = await readBody(event);
    const { API_KEY } = useRuntimeConfig(event);

    const genAI = new GoogleGenerativeAI(API_KEY);

    const schema = {
      type: SchemaType.OBJECT,
      required: ["title", "ingredients", "steps", "tips"],
      description: "Extracted recipe details from the blog post",
      properties: {
        title: {
          type: SchemaType.STRING,
          description: "Recipe title",
        },
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
          type: SchemaType.ARRAY,
          description: "Tips for the recipe",
          items: {
            type: SchemaType.STRING,
          },
        },
      },
    };

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash-lite",
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
      "give me the recipe title, ingredients list, recipe steps, and any additional tips from this blog post. please do not include any '\n' in your answer.",
    ]);

    const recipeDetails = JSON.parse(result.response.text());

    console.log("recipeDetails", recipeDetails);

    const { title, ingredients, steps, tips } = recipeDetails;

    const tipsConcat = tips.join(" | ");

    async function checkIfRecipeExists(url: string) {
      try {
        const recipe = await prisma.recipe.findUnique({
          where: {
            archived: false,
            url,
          },
        });
        return recipe;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    const newRecipe = await prisma.recipe.create({
      data: {
        title,
        url,
        notes: tipsConcat,
      },
    });

    ingredients.forEach(async (ingredient: string) => {
      await prisma.ingredient.create({
        data: {
          text: ingredient,
          recipeId: newRecipe.id,
        },
      });
    });

    steps.forEach(async (step: string) => {
      await prisma.recipeStep.create({
        data: {
          text: step,
          recipeId: newRecipe.id,
        },
      });
    });

    const newSession = await prisma.session.create({
      data: {
        userId: Number(userId),
        recipeId: newRecipe.id,
      },
    });

    setResponseStatus(event, 201);

    return { sessionId: newSession, recipe: newRecipe };
  } catch (e) {
    setResponseStatus(event, 500);
    console.error(e);
    return { error: e };
  }
});
