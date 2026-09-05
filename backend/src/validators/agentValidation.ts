import { z } from "zod";

export const recipeQuerySchema = z.object({
  query: z.string().min(1, "Search query is required").trim(),
});

export type RecipeQueryInput = z.infer<typeof recipeQuerySchema>;
