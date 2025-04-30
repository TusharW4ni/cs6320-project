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

let cachedDbId: string | undefined;

/**
 * Ensures the database exists
 * Reorders properties if the DB already exists
 * Else creates a new DB
 * @param notionKey            
 * @param parentPageIdentifier 
 * @returns
 */

export async function ensureAssignmentsDatabase(
  notionKey: string | undefined,
  parentPageIdentifier: string
): Promise<string> {
  const notion = getNotionClient(notionKey);

  if (cachedDbId) {
    try {
      await notion.databases.retrieve({ database_id: cachedDbId });
      return cachedDbId;
    } catch (e: any) {
      console.warn(
        `Cached DB ID ${cachedDbId} no longer exists — clearing cache`
      );
      cachedDbId = undefined;
      delete process.env.ASSIGNMENTS_DB_ID;
    }
  }

  let parentPageId: string;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(parentPageIdentifier)) {
    parentPageId = parentPageIdentifier;
  } else {
    const searchRes = await notion.search({
      query: parentPageIdentifier,
      filter: { property: "object", value: "page" }
    });
    if (!searchRes.results.length) {
      throw new Error(
        `No Notion page found with title "${parentPageIdentifier}"`
      );
    }
    parentPageId = (searchRes.results[0] as any).id;
  }

  // Look for existing database
  const dbSearch = await notion.search({
    query: "Assignments and Exams",
    filter: { property: "object", value: "database" }
  });

  const existing = (dbSearch.results as any[])
  .filter(item => !(item as any).archived)
  .find(item => {
    const titleArr = (item as any).title
    return Array.isArray(titleArr) && titleArr.some((t: any) => t.plain_text === "Assignments and Exams")
  })

  // DB order/schema
  const desiredProps = {
    Status:       { checkbox: {} },
    Course:       { select:      { options: [] } },
    Name:         { title:       {} },
    "Due Date":   { date:        {} },
    "Days Left":  {
      formula: {
        expression: `
        if(
          ceil(dateBetween(prop("Due Date"), now(), "hours") / 24) == 1,
          "💛 Due Tomorrow",
          if(
              ceil(dateBetween(prop("Due Date"), now(), "hours") / 24) > 0,
              "💚 " + format(ceil(dateBetween(prop("Due Date"), now(), "hours") / 24)) + " days left",
              if(
                ceil(dateBetween(prop("Due Date"), now(), "hours") / 24) < 0,
                "🚨 " + format(abs(dateBetween(prop("Due Date"), now(), "days"))) + " days overdue!",
                "❤️‍🔥 Due Today"
              )
          )
        )
        `.trim()
      }
    },
    Task: { multi_select: { options: [] } }
  };

  if (existing) {
    const dbId = (existing as any).id;
    // Reorder properties on existing DB
    await notion.databases.update({
      database_id: dbId,
      properties: desiredProps
    });
    cachedDbId = dbId;
    return dbId;
  }

  // Create new DB with respective column orders 
  const resp = await notion.databases.create({
    parent: { page_id: parentPageId },
    title: [{ type: "text", text: { content: "Assignments and Exams" } }],
    properties: desiredProps
  });

  cachedDbId = resp.id;
  return resp.id;
}

// Adds a new assignment/exam entry to the specified database.
// "Days Left" column is a auto calculated by Notion
export async function addAssignment(
  databaseId: string,
  data: { course: string; title: string; dueDate: string; taskTags: string[] },
  notionKey: string | undefined
) {
  const notion = getNotionClient(notionKey);
  return notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Status:      { checkbox: false },
      Course:      { select:     { name: data.course } },
      Name:        { title:      [{ text: { content: data.title } }] },
      "Due Date":  { date:       { start: data.dueDate } },
      Task:        { multi_select: data.taskTags.map(name => ({ name })) }
    }
  });
}