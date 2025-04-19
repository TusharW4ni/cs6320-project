/*
  Warnings:

  - Added the required column `url` to the `recipe` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_recipe" ("archived", "createdAt", "id", "notes", "title") SELECT "archived", "createdAt", "id", "notes", "title" FROM "recipe";
DROP TABLE "recipe";
ALTER TABLE "new_recipe" RENAME TO "recipe";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
