import mongoose, { Document, Schema } from "mongoose";

export interface IGroceryItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
}

export interface IGroceryList {
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
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
