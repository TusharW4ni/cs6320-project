import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // // Create a sample user
  // const user = await prisma.user.create({
  //   data: {
  //     email: "reachtusharwani@gmail.com",
  //     firstName: "Tushar",
  //     lastName: "Wani",
  //   },
  // });

  // // Create the tofu sofritas recipe with nested ingredients and directions.
  // const recipe = await prisma.recipe.create({
  //   data: {
  //     title: "Tofu Sofritas Recipe",
  //     // The "notes" field holds extra tips/info
  //     notes:
  //       "* If super firm tofu is not available, use extra firm tofu. Crumble the tofu into small pieces but not as small as the super firm tofu: if you crumble really small, it will get mushy. Check out the reference photo in the FAQ section. Then, coat the tofu crumbles with 1 tablespoon cornstarch and ½ teaspoon kosher salt. Coating the tofu in cornstarch improves its texture quite a bit, giving it a slightly crisp coating and more chew, similar to Chipotle’s sofritas.\n** Use ½ teaspoon adobo sauce for mild heat.\n*** Want to save ~10 minutes? Cook the tofu in a separate pan while you cook the aromatics.",
  //     User: {
  //       connect: { id: user.id },
  //     },
  //     Ingredients: {
  //       create: [
  //         { text: "1 poblano pepper or green bell pepper, (kept whole)" },
  //         { text: "3 tablespoons olive oil or avocado oil, (divided)" },
  //         { text: "1 medium yellow or red onion, (finely chopped)" },
  //         { text: "4 garlic cloves, (chopped)" },
  //         { text: "2 tablespoons tomato paste" },
  //         { text: "1 ½ teaspoons ground cumin" },
  //         { text: "1 teaspoon Mexican oregano (or regular oregano)" },
  //         { text: "½ teaspoon ancho chile powder" },
  //         { text: "1 ½ teaspoons kosher salt, (divided)" },
  //         { text: "A generous amount of freshly cracked black pepper" },
  //         {
  //           text: "1 (12 to 16-ounce) block of super firm tofu (also sold as high-protein tofu)*",
  //         },
  //         { text: "2 roma tomatoes, (chopped)" },
  //         { text: "1 chipotle pepper in adobo + 1/2 tablespoon adobo sauce**" },
  //         { text: "2 teaspoons red wine vinegar" },
  //         { text: "½ cup (120 mL) water" },
  //         { text: "Lime juice (to finish)" },
  //       ],
  //     },
  //     Directions: {
  //       create: [
  //         {
  //           step: "Broil the poblano pepper or green bell pepper. Two options: a) Broiler: Arrange an oven rack 6 inches below the broiler flame. Lightly oil the whole pepper, broil for 5 minutes, flip, and repeat. Allow to cool, then remove stem and seeds. b) Gas flame: Remove the stem, char over a high gas flame turning every minute until blistered (about 4 minutes total).",
  //         },
  //         {
  //           step: "Cook the aromatics. Heat 1 ½ tablespoons oil in a nonstick pan over medium-high heat. Add chopped onion with a pinch of salt and cook for 5–6 minutes. Add garlic and cook for 2 minutes, stirring frequently. Then add tomato paste, cumin, oregano, chile powder, 1 teaspoon salt, and pepper, cooking for 1 minute. Finally, add tomatoes and cook until softened (about 5 minutes).",
  //         },
  //         {
  //           step: "While the onions are cooking, cut the tofu into 4 slabs, squeeze out water, and crumble into small pieces (about the size of a blueberry).",
  //         },
  //         {
  //           step: "Transfer the onion-tomato mixture to a blender or food processor. Add the broiled pepper, chipotle pepper in adobo, vinegar, and water. Blend until relatively smooth. Taste and adjust seasonings as needed.",
  //         },
  //         {
  //           step: "Heat the remaining 1 ½ tablespoons oil in the pan over medium-high heat. Add the tofu, spread it out in a single layer, and season with ½ teaspoon kosher salt. Cook undisturbed for 2–3 minutes, flip, and continue cooking (stirring every 2–3 minutes) for a total of 12 minutes until browned.",
  //         },
  //         {
  //           step: "Pour in the blended sauce and simmer for 5 minutes, stirring occasionally. If it thickens too much, add a few splashes of water. Then lower the heat and cook for another 5 minutes until the flavors meld.",
  //         },
  //         {
  //           step: "Taste and adjust seasonings. If tangy, add a pinch of organic brown or cane sugar. Finish with a squeeze of lime juice.",
  //         },
  //       ],
  //     },
  //   },
  // });

  // // Create a sample conversation session for the user
  // await prisma.session.create({
  //   data: {
  //     User: {
  //       connect: { id: user.id },
  //     },
  //     Recipe: {
  //       connect: { id: recipe.id },
  //     },
  //     Messages: {
  //       create: [
  //         {
  //           content: "Hi, can you help me with a tofu sofritas recipe?",
  //           role: "user",
  //         },
  //         {
  //           content:
  //             "Sure! I've just seeded a delicious tofu sofritas recipe in our database. Check out the steps and tips for guidance.",
  //           role: "assistant",
  //         },
  //       ],
  //     },
  //   },
  // });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
