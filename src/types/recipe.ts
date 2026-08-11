export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  cuisine: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  image?: string;
  isUserCreated?: boolean;
}

export interface Favorite {
  recipeId: string;
  addedAt: number;
}
