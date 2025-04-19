/*
  Warnings:

  - You are about to drop the `direction` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `ingredient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `ingredient` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `ingredient` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `recipeId` on the `ingredient` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `message` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `sessionId` on the `message` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `recipe` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `updatedAt` on the `recipe` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `recipe` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `recipe` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `session` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `recipeId` on the `session` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `userId` on the `session` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `text` to the `ingredient` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "direction";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "recipe_step" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "recipe_step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ingredient" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ingredient" ("archived", "id", "recipeId") SELECT "archived", "id", "recipeId" FROM "ingredient";
DROP TABLE "ingredient";
ALTER TABLE "new_ingredient" RENAME TO "ingredient";
CREATE TABLE "new_message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_message" ("archived", "content", "id", "role", "sessionId", "timestamp") SELECT "archived", "content", "id", "role", "sessionId", "timestamp" FROM "message";
DROP TABLE "message";
ALTER TABLE "new_message" RENAME TO "message";
CREATE TABLE "new_recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_recipe" ("archived", "createdAt", "id", "notes", "title") SELECT "archived", "createdAt", "id", "notes", "title" FROM "recipe";
DROP TABLE "recipe";
ALTER TABLE "new_recipe" RENAME TO "recipe";
CREATE TABLE "new_session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "session_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_session" ("archived", "createdAt", "id", "recipeId", "userId") SELECT "archived", "createdAt", "id", "recipeId", "userId" FROM "session";
DROP TABLE "session";
ALTER TABLE "new_session" RENAME TO "session";
CREATE TABLE "new_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_user" ("archived", "email", "firstName", "id", "lastName") SELECT "archived", "email", "firstName", "id", "lastName" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
