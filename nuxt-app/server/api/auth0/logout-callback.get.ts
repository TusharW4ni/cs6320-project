export default defineEventHandler(async (event) => {
  setCookie(event, "token", "");
  await sendRedirect(event, "/");
});
