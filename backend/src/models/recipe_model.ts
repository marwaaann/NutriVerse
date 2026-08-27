import mongoose, { Schema, Document } from "mongoose";

interface IIngredientSchema {
  name: string;
  quantity: number;
  unit: string;
  normalizedName?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface INutritionSchema {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbohydratesPerServing?: number;
  fatPerServing?: number;
}

interface IRecipeDocument extends Document {
  title: string;
  description?: string;
  ingredients: IIngredientSchema[];
  preparationSteps: string[];
  cookingTime: number;
  servings: number;
  category?: string;
  image?: string;
  authorId: string;
  nutrition?: INutritionSchema;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbohydratesPerServing?: number;
  fatPerServing?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ingredientSchema = new Schema<IIngredientSchema>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    normalizedName: { type: String },
    calories: { type: Number },
    protein: { type: Number },
    carbohydrates: { type: Number },
    fat: { type: Number },
    fiber: { type: Number },
    sugar: { type: Number },
    sodium: { type: Number },
  },
  { _id: false }
);

const nutritionSchema = new Schema<INutritionSchema>(
  {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbohydrates: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number },
    sugar: { type: Number },
    sodium: { type: Number },
    caloriesPerServing: { type: Number },
    proteinPerServing: { type: Number },
    carbohydratesPerServing: { type: Number },
    fatPerServing: { type: Number },
  },
  { _id: false }
);

const recipeSchema = new Schema<IRecipeDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ingredients: [ingredientSchema],
    preparationSteps: [
      {
        type: String,
        required: true,
      },
    ],
    cookingTime: {
      type: Number,
      required: true,
      min: 0,
    },
    servings: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    authorId: {
      type: String,
      required: true,
      index: true,
    },
    nutrition: nutritionSchema,
    caloriesPerServing: {
      type: Number,
    },
    proteinPerServing: {
      type: Number,
    },
    carbohydratesPerServing: {
      type: Number,
    },
    fatPerServing: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
recipeSchema.index({ authorId: 1, createdAt: -1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ title: "text" });

export const RecipeModel = mongoose.model<IRecipeDocument>("Recipe", recipeSchema);

export { IRecipeDocument, IIngredientSchema, INutritionSchema };
