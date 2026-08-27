import mongoose, { Document, Schema } from "mongoose";

export interface IUserPreferences {
  userId: string;
  cuisines: string[];
  diet: string;
  nonVegPreference: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  healthGoals: string[];
  cookingTime: string;
  spiceLevel: string;
  mealTypes: string[];
}

export interface IUserPreferencesDocument extends IUserPreferences, Document {}

const userPreferencesSchema = new Schema<IUserPreferencesDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cuisines: [String],
    diet: {
      type: String,
      default: "Other",
    },
    nonVegPreference: [String],
    allergies: [String],
    dietaryRestrictions: [String],
    healthGoals: [String],
    cookingTime: {
      type: String,
      default: "30 minute meals",
    },
    spiceLevel: {
      type: String,
      default: "Medium",
    },
    mealTypes: [String],
  },
  {
    timestamps: true,
  }
);

export const UserPreferencesModel = mongoose.model<IUserPreferencesDocument>(
  "UserPreferences",
  userPreferencesSchema
);
