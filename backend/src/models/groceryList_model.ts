import mongoose, { Document, Schema } from "mongoose";

export interface IGroceryItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  purchased: boolean;
}

export interface IGroceryList {
  userId: string;
  title: string;
  recipeId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  items: IGroceryItem[];
}

export interface IGroceryListDocument extends IGroceryList, Document {}

const groceryItemSchema = new Schema<IGroceryItem>(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "units" },
    category: { type: String, default: "Other" },
    purchased: { type: Boolean, default: false },
  }
);

const groceryListSchema = new Schema<IGroceryListDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Grocery List",
    },
    recipeId: {
      type: String,
    },
    startDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    endDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    items: [groceryItemSchema],
  },
  {
    timestamps: true,
  }
);

export const GroceryListModel = mongoose.model<IGroceryListDocument>(
  "GroceryList",
  groceryListSchema
);
