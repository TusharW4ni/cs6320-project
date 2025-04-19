/*
  Warnings:

  - You are about to drop the column `title` on the `recipe` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_recipe" ("archived", "createdAt", "id", "notes", "url") SELECT "archived", "createdAt", "id", "notes", "url" FROM "recipe";
DROP TABLE "recipe";
ALTER TABLE "new_recipe" RENAME TO "recipe";
CREATE UNIQUE INDEX "recipe_url_key" ON "recipe"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
