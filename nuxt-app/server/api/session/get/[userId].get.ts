import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, "userId");
  console.log("userId", userId);
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      archived: false,
    },
    select: {
      id: true,
      Recipe: {
        select: {
          title: true,
        },
      },
    },
  });

  return sessions;
});
