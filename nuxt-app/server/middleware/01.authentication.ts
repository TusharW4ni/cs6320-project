import jwt from "jsonwebtoken";
import fs from "fs";
import {
  loginRedirectUrl,
  logoutRedirectUrl,
} from "../api/auth0/redirect-urls";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "token") || "";
  // ---- ▼ Comment out these lines to test APIs ▼ ---- //
  // console.log({ event: event.node.req.url });
  // if (!token && event.node.req.url !== "/api/login-callback") {
  //   // if (event.node.req.url !== "/") {
  //   sendRedirect(event, loginRedirectUrl());
  //   // }
  // } else {
  //   // try {
  //   try {
  //     const claims = jwt.verify(
  //       token,
  //       fs.readFileSync(process.cwd() + "/cert-dev.pem")
  //     );
  //     event.context.claims = claims;
  //   } catch (e) {
  //     console.error(e);
  //     sendRedirect(event, logoutRedirectUrl(token));
  //   }
  //   // } catch (e) {
  //   // console.error(e);
  //   // }
  // }
  // ---- ▲ Comment out these lines to test APIs ▲ ---- //
});
