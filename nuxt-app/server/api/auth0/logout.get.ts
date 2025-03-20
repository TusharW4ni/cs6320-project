import { logoutRedirectUrl } from "./redirect-urls";

export default defineEventHandler(async (event) => {
  const id_token = getCookie(event, "token");
  await sendRedirect(event, logoutRedirectUrl(id_token as string) || "");
});
