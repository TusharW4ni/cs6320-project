import { Client } from "@notionhq/client";

// Returns a Notion client authenticated or NOTION_API_KEY environment variable.
function getNotionClient(token?: string) {
  const key = token ?? process.env.NOTION_API_KEY;
  if (!key) {
    throw new Error(
      "Notion API key missing: pass ntnApiKey or set NOTION_API_KEY"
    );
  }
  return new Client({ auth: key });
}

let cachedTaskDbId: string | undefined;

export async function ensureTasksDatabase(
  notionKey: string | undefined,
  parentPageIdentifier: string
): Promise<string> {
  const notion = getNotionClient(notionKey);
  const trimmedParentPageIdentifier = parentPageIdentifier.trim();
  console.log(
    "ensureTasksDatabase: parentPageIdentifier=",
    trimmedParentPageIdentifier
  );

  if (cachedTaskDbId) {
    console.log("ensureTasksDatabase: cachedTaskDbId=", cachedTaskDbId);
    try {
      await notion.databases.retrieve({ database_id: cachedTaskDbId });
      return cachedTaskDbId;
    } catch (e: any) {
      console.warn(
        `Cached Task DB ID ${cachedTaskDbId} no longer exists — clearing cache`
      );
      cachedTaskDbId = undefined;
      delete process.env.TASKS_DB_ID;
    }
  }

  let parentPageId: string;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(trimmedParentPageIdentifier)) {
    parentPageId = trimmedParentPageIdentifier;
    console.log("ensureTasksDatabase: parentPageIdentifier is a UUID");
  } else {
    console.log(
      "ensureTasksDatabase: parentPageIdentifier is NOT a UUID, searching..."
    );
    const searchRes = await notion.search({
      query: trimmedParentPageIdentifier,
      filter: { property: "object", value: "page" },
    });
    if (!searchRes.results.length) {
      throw new Error(
        `No Notion page found with title "${trimmedParentPageIdentifier}"`
      );
    }
    parentPageId = (searchRes.results[0] as any).id;
    console.log("ensureTasksDatabase: found parentPageId=", parentPageId);
  }

  // Look for existing database
  const dbSearch = await notion.search({
    query: "Tasks",
    filter: { property: "object", value: "database" },
  });

  const existing = (dbSearch.results as any[])
    .filter((item) => !(item as any).archived)
    .find((item) => {
      const titleArr = (item as any).title;
      return (
        Array.isArray(titleArr) &&
        titleArr.some((t: any) => t.plain_text === "Tasks")
      );
    });

  // DB order/schema
  const desiredPropsTask: any = {
    Name: { title: {} },
    Priority: {
      select: {
        options: [],
      },
    },
    Status: { checkbox: {} },
  };

  if (existing) {
    const dbId = (existing as any).id;
    console.log("ensureTasksDatabase: found existing database, id=", dbId);
    // Reorder properties on existing DB
    await notion.databases.update({
      database_id: dbId,
      properties: desiredPropsTask,
    });
    cachedTaskDbId = dbId;
    return dbId;
  } else {
    console.log("ensureTasksDatabase: creating new database");
    // Create new DB with respective column orders
    const respTask = await notion.databases.create({
      parent: { page_id: parentPageId },
      title: [{ type: "text", text: { content: "Tasks" } }],
      properties: desiredPropsTask,
    });

    cachedTaskDbId = respTask.id;
    console.log(
      "ensureTasksDatabase: created new database, id=",
      cachedTaskDbId
    );
    return respTask.id;
  }
}

// Adds a new task to the Tasks database
export async function createTask(
  databaseId: string,
  data: { title: string; priority: string },
  notionKey: string | undefined
) {
  const notion = getNotionClient(notionKey);

  const properties: any = {
    Name: { title: [{ text: { content: data.title } }] },
    Priority: { select: { name: data.priority } },
    Status: { checkbox: false },
  };
  return notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  });
}
