import { FunctionDeclaration, Type } from "@google/genai";

export const createNewPageFn: FunctionDeclaration = {
  name: "createNewPage",
  description: "Create a free-form page in Notion",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title:   { type: Type.STRING, description: "Title of the new page" },
      content: { type: Type.STRING, description: "Markdown content of the page" }
    },
    required: ["title","content"]
  }
};

export const createAssignmentFn: FunctionDeclaration = {
  name: "createAssignment",
  description: "Add a new assignment or exam to the Assignments and Exams database",
  parameters: {
    type: Type.OBJECT,
    properties: {
      course:   { type: Type.STRING, description: "Course name" },
      title:    { type: Type.STRING, description: "Assignment title" },
      dueDate:  { type: Type.STRING, description: "Due date in YYYY-MM-DD format" },
      taskTags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Tags like Assignment, Exam, Quiz, etc."
      }
    },
    required: ["course","title","dueDate","taskTags"]
  }
};
