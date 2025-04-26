import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  const ntnApiKey = getRouterParam(event, "ntnApiKey") || {};

  try {
    const notion = new Client({ auth: ntnApiKey as string });
    const userList = await notion.users.list();
    const user = userList.results.find((user) => user.type === "person");
    setResponseStatus(event, 200);
    return user;
  } catch (e) {
    setResponseStatus(event, 500);
    return { error: "Failed to retrieve user" };
  }
});
