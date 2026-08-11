import Dexie, { Table } from "dexie";
import { Favorite, Recipe } from "../types/recipe";
import { Settings } from "../types/settings";
import seedData from "../data/recipes.seed.json";

export class CookMateDB extends Dexie {
  recipes!: Table<Recipe, string>;
  favorites!: Table<Favorite, string>;
  settings!: Table<Settings, string>;
  userRecipes!: Table<Recipe, string>;

  constructor() {
    super("CookMateDatabase");
    this.version(1).stores({
      recipes: "id, name, category, cuisine, difficulty, *tags",
      favorites: "recipeId",
      settings: "id",
      userRecipes: "id, name, category",
    });
  }
}

export const db = new CookMateDB();

export async function initializeDb() {
  const recipeCount = await db.recipes.count();
  if (recipeCount === 0) {
    console.log("Database is empty. Populating with seed data...");
    await db.recipes.bulkPut(seedData as Recipe[]);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put({
      id: "user-settings",
      aiEnabled: true,
      activeModelId: "qwen-0.5b",
      theme: "system",
    });
  }
}
