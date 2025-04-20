import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const sessionId = getRouterParam(event, "sessionId");
    const session = await prisma.session.findUnique({
      where: {
        id: Number(sessionId),
        archived: false,
      },
      select: {
        id: true,
        Recipe: {
          include: {
            Ingredients: true,
          },
        },
        Messages: true,
      },
    });
    setResponseStatus(event, 200);
    return { session };
  } catch (e) {
    setResponseStatus(event, 500);
    console.error(e);
    return { error: "Internal Server Error" };
  }
});
