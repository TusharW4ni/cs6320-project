import {
  loginRedirectUrl,
  logoutRedirectUrl,
} from "../api/auth0/redirect-urls";
import prisma from "../../lib/prisma";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "token") || "";
  // ---- ▼ Comment out these lines to test APIs ▼ ---- //
  // const claims = event.context.claims;
  // if (!claims) {
  //   // if (event.node.req.url !== "/") {
  //   sendRedirect(event, loginRedirectUrl());
  //   // }
  // }
  // try {
  //   const { email } = claims;
  //   const user = await prisma.user.findUnique({
  //     where: {
  //       email,
  //       archived: false,
  //     },
  //   });
  //   setCookie(event, "currentUser", JSON.stringify(user), {
  //     maxAge: 60 * 60 * 24 * 5,
  //   });
  //   if (!user) {
  //     // sendRedirect(event, logoutRedirectUrl(token));
  //     const newUser = await prisma.user.create({
  //       data: {
  //         email,
  //       },
  //     });
  //     event.context.user = newUser;
  //     setCookie(event, "currentUser", JSON.stringify(newUser), {
  //       maxAge: 60 * 60 * 24 * 5,
  //     });
  //     await sendRedirect(event, "/settings");
  //   } else {
  //     event.context.user = user;
  //   }
  // } catch (e) {
  //   console.error("Error in authorization middleware: \n", e);
  // }
  // ---- ▲ Comment out these lines to test APIs ▲ ---- //
});
