import { db } from "../db/database";
import { Recipe } from "../types/recipe";

export interface SearchFilters {
  query?: string;
  category?: string;
  cuisine?: string;
  difficulty?: string;
  maxTime?: number | null;
  ingredients?: string[]; // from AI
  exclude?: string[];     // from AI
}

export const SearchService = {
  async searchRecipes(filters: SearchFilters): Promise<Recipe[]> {
    let recipes = await db.recipes.toArray();

    return recipes
      .map((recipe) => {
        let score = 0;

        // Base match score if no query/ingredients (just to return all)
        if (!filters.query && (!filters.ingredients || filters.ingredients.length === 0)) {
           score = 1;
        }

        const q = filters.query?.toLowerCase() || "";

        if (q) {
          if (recipe.name.toLowerCase().includes(q)) score += 50;
          if (recipe.description.toLowerCase().includes(q)) score += 5;
          if (recipe.category.toLowerCase().includes(q)) score += 10;
          if (recipe.tags.some(t => t.toLowerCase().includes(q))) score += 10;
          if (recipe.ingredients.some(i => i.name.toLowerCase().includes(q))) score += 20;
        }

        // AI Ingredient matching
        if (filters.ingredients && filters.ingredients.length > 0) {
           filters.ingredients.forEach(ing => {
             const lowerIng = ing.toLowerCase();
             if (recipe.ingredients.some(i => i.name.toLowerCase().includes(lowerIng))) {
               score += 20;
             }
             if (recipe.name.toLowerCase().includes(lowerIng)) {
               score += 15;
             }
           });
        }

        return { recipe, score };
      })
      .filter(({ recipe, score }) => {
        // Exclude if it has excluded ingredients
        if (filters.exclude && filters.exclude.length > 0) {
           const hasExcluded = filters.exclude.some(ex => 
             recipe.ingredients.some(i => i.name.toLowerCase().includes(ex.toLowerCase())) ||
             recipe.tags.some(t => t.toLowerCase().includes(ex.toLowerCase()))
           );
           if (hasExcluded) return false;
        }

        // Must have some score to be relevant
        if (score <= 0) return false;

        // Apply hard filters
        if (filters.category && filters.category !== "All" && recipe.category !== filters.category) return false;
        if (filters.cuisine && filters.cuisine !== "All" && recipe.cuisine !== filters.cuisine) return false;
        if (filters.difficulty && filters.difficulty !== "All" && recipe.difficulty !== filters.difficulty) return false;
        
        const totalTime = recipe.prepTime + recipe.cookTime;
        if (filters.maxTime && totalTime > filters.maxTime) return false;

        return true;
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.recipe);
  }
};
