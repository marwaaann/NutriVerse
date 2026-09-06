import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").trim(),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, "Recipe title is required").max(200, "Title too long").trim(),
  description: z.string().optional().default(""),
  ingredients: z.array(ingredientSchema).min(1, "At least one ingredient is required"),
  preparationSteps: z.array(z.string().min(1, "Step cannot be empty")).min(1, "At least one preparation step is required"),
  cookingTime: z.number().int().positive("Cooking time must be positive (in minutes)"),
  servings: z.number().int().positive("Servings must be at least 1"),
  category: z.string().optional().default(""),
  image: z.string().optional().default(""),
  imagePublicId: z.string().optional(),
});

export const updateRecipeSchema = z.object({
  title: z.string().min(1, "Recipe title is required").max(200, "Title too long").trim().optional(),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).optional(),
  preparationSteps: z.array(z.string().min(1, "Step cannot be empty")).optional(),
  cookingTime: z.number().int().positive("Cooking time must be positive").optional(),
  servings: z.number().int().positive("Servings must be at least 1").optional(),
  category: z.string().optional(),
  image: z.string().optional(),
  imagePublicId: z.string().optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;
