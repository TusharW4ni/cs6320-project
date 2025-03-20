import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    if (!body.id) {
      return {
        status: 400,
        message: "Invalid request. Please provide user id to update.",
      };
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: body.id,
      },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
      },
    });

    return {
      status: 200,
      message: "User updated successfully.",
      user: updatedUser,
    };
  } catch (error) {
    return {
      status: 500,
      message: "An error occurred while updating the user.",
      error: error.message,
    };
  }
});
