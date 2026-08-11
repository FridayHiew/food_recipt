import { z } from "zod";

export const recipeSearchSchema = z.object({
  intent: z.enum([
    "find_recipe",
    "find_by_ingredient",
    "find_by_time",
    "find_by_cuisine",
    "find_by_diet"
  ]).default("find_recipe"),
  ingredients: z.array(z.string()).default([]),
  exclude: z.array(z.string()).default([]),
  max_time: z.number().nullable().default(null),
  difficulty: z.string().nullable().default(null),
  cuisine: z.string().nullable().default(null),
  dietary_requirements: z.array(z.string()).default([])
});

export type RecipeSearchOutput = z.infer<typeof recipeSearchSchema>;
