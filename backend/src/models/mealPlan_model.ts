import mongoose, { Document, Schema } from "mongoose";

export interface IMealSlot {
  recipeId?: string;
  title: string;
  image?: string;
  reason?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
}

export interface IMealPlan {
  userId: string;
  date: string; // YYYY-MM-DD
  breakfast?: IMealSlot;
  lunch?: IMealSlot;
  snack?: IMealSlot;
  dinner?: IMealSlot;
}

export interface IMealPlanDocument extends IMealPlan, Document {}

const mealSlotSchema = new Schema<IMealSlot>(
  {
    recipeId: String,
    title: { type: String, required: true },
    image: String,
    reason: String,
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    servings: { type: Number, default: 1 },
  },
  { _id: false }
);

const mealPlanSchema = new Schema<IMealPlanDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    breakfast: mealSlotSchema,
    lunch: mealSlotSchema,
    snack: mealSlotSchema,
    dinner: mealSlotSchema,
  },
  {
    timestamps: true,
  }
);

mealPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export const MealPlanModel = mongoose.model<IMealPlanDocument>(
  "MealPlan",
  mealPlanSchema
);
