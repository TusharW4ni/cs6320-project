import { FunctionDeclaration, Type } from "@google/genai";

export const createNewPageFn: FunctionDeclaration = {
  name: "createNewPage",
  description: "Create a page in Notion",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Title of the new page" },
      content: { type: Type.STRING, description: "Content of the page" },
    },
    required: ["title", "content"],
  },
};

export const createAssignmentFn: FunctionDeclaration = {
  name: "createAssignment",
  description:
    "Add a new assignment or exam to the Assignments and Exams database.  The title is the only absolutely required parameter.  Other parameters are optional. If no dueDate is provided, today's date will be used.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      course: { type: Type.STRING, description: "Course name" },
      title: { type: Type.STRING, description: "Assignment title" },
      dueDate: {
        type: Type.STRING,
        description:
          "Due date in YYYY-MM-DD format. If the due date is not in that format, make an inference based on information provided about the due date",
      },
      taskTags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tags like Assignment, Exam, Quiz, etc.",
      },
    },
    required: ["title"],
  },
};

export const updateAssignmentFn: FunctionDeclaration = {
  name: "updateAssignment",
  description: "Update an existing assignment in Notion by its title",
  parameters: {
    type: Type.OBJECT,
    properties: {
      pageID: {
        type: Type.STRING,
        description: "The ID of the Notion page to update",
      },
      course: {
        type: Type.STRING,
        description: "Updated course name (optional)",
      },
      title: {
        type: Type.STRING,
        description: "Updated title of the assignment (optional)",
      },
      dueDate: {
        type: Type.STRING,
        description:
          "Updated due date in YYYY-MM-DD format. If the due date is not in that format, make an inference based on information provided about the due date (optional)",
      },
      taskTags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          "Updated tags like Assignment, Exam, Quiz, etc. (optional)",
      },
      status: {
        type: Type.BOOLEAN,
        description: "Set to true if completed, false otherwise (optional)",
      },
    },
    required: ["title"],
  },
};

export const createTaskFn: FunctionDeclaration = {
  name: "createTask",
  description: "Add a new task to the Tasks database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Task title" },
      priority: {
        type: Type.STRING,
        description: "Priority of the task",
      },
      status: {
        type: Type.BOOLEAN,
        description: "Set to true if completed, false otherwise",
      },
    },
    required: ["title"],
  },
};
