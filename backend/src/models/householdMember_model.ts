import mongoose, { Document, Schema } from "mongoose";

export interface IHouseholdMember {
  userId: string;
  name: string;
  ageGroup: string;
  relationship: string;
  dietaryPreference: string;
  allergies: string[];
  dislikedFoods: string[];
  preferredFoods: string[];
  cuisines: string[];
  spiceLevel: string;
  mealPreferences: string[];
}

export interface IHouseholdMemberDocument extends IHouseholdMember, Document {}

const householdMemberSchema = new Schema<IHouseholdMemberDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    ageGroup: {
      type: String,
      default: "Adult",
    },
    relationship: {
      type: String,
      default: "Family",
    },
    dietaryPreference: {
      type: String,
      default: "Other",
    },
    allergies: [String],
    dislikedFoods: [String],
    preferredFoods: [String],
    cuisines: [String],
    spiceLevel: {
      type: String,
      default: "Medium",
    },
    mealPreferences: [String],
  },
  {
    timestamps: true,
  }
);

export const HouseholdMemberModel = mongoose.model<IHouseholdMemberDocument>(
  "HouseholdMember",
  householdMemberSchema
);
