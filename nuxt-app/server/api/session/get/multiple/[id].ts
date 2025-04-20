import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, "id");
    console.log({ userId });
    // const sessions = await prisma.session.findMany({
    //   where: {
    //     userId: Number(userId),
    //     archived: false,
    //   },
    //   select: {
    //     id: true,
    //     Recipe: true,
    //     Messages: true,
    //   },
    // });
    const user = await prisma.user.findUnique({
      where: {
        archived: false,
        id: Number(userId),
      },
      include: {
        Sessions: {
          include: {
            Recipe: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });
    setResponseStatus(event, 200);
    return { user };
  } catch (e) {
    setResponseStatus(event, 500);
    console.error(e);
    return { error: "Internal Server Error" };
  }
});
