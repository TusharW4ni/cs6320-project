import { Client } from "@notionhq/client";

export default defineEventHandler(async (event) => {
  const { apiKey, dbId, courses } = await readBody(event);
  console.log("courses", courses);
  const notion = new Client({ auth: apiKey });
  const valueCourses = [];
  for (const key in courses) {
    if (courses.hasOwnProperty(key)) {
      valueCourses.push(courses[key]);
    }
  }
  try {
    valueCourses.forEach(async (course: any) => {
      await notion.pages.create({
        parent: {
          type: "database_id",
          database_id: dbId,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: course.course_name,
                },
              },
            ],
          },
          Code: {
            rich_text: [
              {
                text: {
                  content:
                    course.course_number + "." + course.course_section_number,
                },
              },
            ],
          },
          Timing: {
            rich_text: [
              {
                text: {
                  content: course.course_timing,
                },
              },
            ],
          },
          Location: {
            rich_text: [
              {
                text: {
                  content: course.class_location,
                },
              },
            ],
          },
          Professor: {
            rich_text: [
              {
                text: {
                  content: course.professor_name,
                },
              },
            ],
          },
        },
        children: [
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Professor name: " + course.professor_name,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Professor email: " + course.professor_email,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Office Hours: " + course.professor_office_hours,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content:
                      "Office Location: " + course.professor_office_location,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Required Textbooks: " + course.required_textbooks,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Weightage: " + course.weightage,
                  },
                },
              ],
            },
          },
          {
            object: "block",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: "Exam Format: " + course.exam_format,
                  },
                },
              ],
            },
          },
        ],
      });
    });
    setResponseStatus(event, 200);
    return { message: "Courses added successfully" };
  } catch (e: any) {
    setResponseStatus(event, 500);
    console.error("Error adding courses:", e);
    return { error: "Failed to add courses", e: e.message };
  }
});
