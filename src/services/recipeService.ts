import { db } from "../db/database";
import { Recipe } from "../types/recipe";

export const RecipeService = {
  async getAllRecipes(): Promise<Recipe[]> {
    return await db.recipes.toArray();
  },

  async getRecipeById(id: string): Promise<Recipe | undefined> {
    return await db.recipes.get(id);
  },

  async getFavorites(): Promise<Recipe[]> {
    const favorites = await db.favorites.toArray();
    const recipeIds = favorites.map((f) => f.recipeId);
    const recipes = await db.recipes.where("id").anyOf(recipeIds).toArray();
    return recipes;
  },

  async isFavorite(recipeId: string): Promise<boolean> {
    const count = await db.favorites.where("recipeId").equals(recipeId).count();
    return count > 0;
  },

  async toggleFavorite(recipeId: string): Promise<boolean> {
    const isFav = await this.isFavorite(recipeId);
    if (isFav) {
      await db.favorites.where("recipeId").equals(recipeId).delete();
      return false;
    } else {
      await db.favorites.add({ recipeId, addedAt: Date.now() });
      return true;
    }
  },
};
