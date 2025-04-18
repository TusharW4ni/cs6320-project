import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, "userId");
    const sessions = await prisma.session.findMany({
      where: {
        userId: Number(userId),
        archived: false,
      },
      select: {
        id: true,
        Recipe: true,
        Messages: true,
      },
    });
    setResponseStatus(event, 200);
    return { sessions };
  } catch (e) {
    setResponseStatus(event, 500);
    console.error(e);
    return { error: "Internal Server Error" };
  }
});
