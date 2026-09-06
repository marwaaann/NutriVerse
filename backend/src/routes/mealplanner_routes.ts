import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { UserPreferencesModel } from "../models/userPreferences_model";
import { HouseholdMemberModel } from "../models/householdMember_model";
import { MealPlanModel } from "../models/mealPlan_model";
import { GroceryListModel } from "../models/groceryList_model";
import { UserModel } from "../models/user_model";
import { aiService, recipeRepository, notificationService } from "../container/container";
import { apiResponse } from "../helpers/apiResponse";
import { AppError } from "../utils/AppError";
import mongoose from "mongoose";

const router = Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// --- PREFERENCES ---
router.get("/preferences", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    let preferences = await UserPreferencesModel.findOne({ userId });
    if (!preferences) {
      // Return defaults
      preferences = new UserPreferencesModel({
        userId,
        cuisines: [],
        diet: "Other",
        nonVegPreference: [],
        allergies: [],
        dietaryRestrictions: [],
        healthGoals: [],
        cookingTime: "30 minute meals",
        spiceLevel: "Medium",
        mealTypes: ["breakfast", "lunch", "dinner", "snack"],
      });
    }
    return apiResponse(res, 200, true, "Preferences loaded", preferences);
  } catch (error) {
    next(error);
  }
});

router.put("/preferences", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const {
      cuisines,
      diet,
      nonVegPreference,
      allergies,
      dietaryRestrictions,
      healthGoals,
      cookingTime,
      spiceLevel,
      mealTypes,
    } = req.body;

    const preferences = await UserPreferencesModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          cuisines,
          diet,
          nonVegPreference,
          allergies,
          dietaryRestrictions,
          healthGoals,
          cookingTime,
          spiceLevel,
          mealTypes,
        },
      },
      { new: true, upsert: true }
    );

    // Update the user document to mark onboarding as completed
    await UserModel.findByIdAndUpdate(userId, { onboardingCompleted: true });

    // Add a single useful welcome notification upon onboarding completion
    try {
      const existing = await notificationService.getUserNotifications(userId);
      const hasWelcome = existing.some((n) => n.title.includes("Welcome"));
      if (!hasWelcome) {
        await notificationService.createNotification(
          userId,
          "system",
          "Welcome to NutriVerse! 👋",
          "Your personalized meal plans and nutrition targets are ready to explore."
        );
      }
    } catch {
      // Non-blocking
    }

    return apiResponse(res, 200, true, "Preferences updated successfully", preferences);
  } catch (error) {
    next(error);
  }
});

// --- HOUSEHOLD ---
router.get("/household", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const members = await HouseholdMemberModel.find({ userId });
    return apiResponse(res, 200, true, "Household members loaded", members);
  } catch (error) {
    next(error);
  }
});

router.post("/household", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const member = new HouseholdMemberModel({
      userId,
      ...req.body,
    });
    await member.save();
    return apiResponse(res, 201, true, "Household member added", member);
  } catch (error) {
    next(error);
  }
});

router.put("/household/:id", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { id } = req.params;
    const member = await HouseholdMemberModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: req.body },
      { new: true }
    );
    if (!member) {
      throw new AppError("Household member not found", 404);
    }
    return apiResponse(res, 200, true, "Household member updated", member);
  } catch (error) {
    next(error);
  }
});

router.delete("/household/:id", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { id } = req.params;
    const member = await HouseholdMemberModel.findOneAndDelete({ _id: id, userId });
    if (!member) {
      throw new AppError("Household member not found", 404);
    }
    return apiResponse(res, 200, true, "Household member removed", null);
  } catch (error) {
    next(error);
  }
});

// --- MEAL PLAN ---
router.get("/plan/range", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError("startDate and endDate are required", 400);
    }

    const plans = await MealPlanModel.find({
      userId,
      date: { $gte: String(startDate), $lte: String(endDate) },
    }).sort({ date: 1 });

    return apiResponse(res, 200, true, "Meal plans loaded", plans);
  } catch (error) {
    next(error);
  }
});

router.post("/plan/generate", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("UNAUTHORIZED", 401);
    }
    const { date, silent } = req.body;

    if (!date) {
      throw new AppError("Date is required YYYY-MM-DD", 400);
    }

    // 1. Gather preferences & household context
    const preferences = await UserPreferencesModel.findOne({ userId });
    const household = await HouseholdMemberModel.find({ userId });

    const preferencesContext = {
      userPreferences: preferences || {},
      householdMembers: household,
      allergies: [
        ...(preferences?.allergies || []),
        ...household.flatMap(h => h.allergies || [])
      ]
    };

    // 2. Fetch available recipes in database
    const availableRecipes = await recipeRepository.findByAuthorId(userId, 50, 0);

    // 3. Request AI plan generation
    const aiPlan = await aiService.generateMealPlan(preferencesContext, availableRecipes, date);

    // 4. Save/Update MealPlan
    const savedPlan = await MealPlanModel.findOneAndUpdate(
      { userId, date },
      {
        $set: {
          breakfast: aiPlan.breakfast,
          lunch: aiPlan.lunch,
          snack: aiPlan.snack,
          dinner: aiPlan.dinner,
        },
      },
      { new: true, upsert: true }
    );

    if (!silent) {
      await notificationService.createNotification(
        userId,
        "Meal Plan Ready",
        "Meal Plan Ready",
        "Your personalized meal plan is ready to review.",
        undefined,
        savedPlan._id?.toString()
      );
    }

    return apiResponse(res, 200, true, "Meal plan generated successfully", savedPlan);
  } catch (error) {
    next(error);
  }
});

router.post("/plan/:date/swap", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { date } = req.params;
    const { mealType, currentMeal } = req.body;

    if (!mealType || !currentMeal) {
      throw new AppError("mealType and currentMeal details are required", 400);
    }

    const preferences = await UserPreferencesModel.findOne({ userId });
    const household = await HouseholdMemberModel.find({ userId });

    const preferencesContext = {
      userPreferences: preferences || {},
      householdMembers: household,
      allergies: [
        ...(preferences?.allergies || []),
        ...household.flatMap(h => h.allergies || [])
      ]
    };

    const alternatives = await aiService.suggestMealSwaps(preferencesContext, mealType, currentMeal);
    return apiResponse(res, 200, true, "Alternatives loaded", alternatives.options);
  } catch (error) {
    next(error);
  }
});

router.put("/plan/:date", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { date } = req.params;
    const { mealType, meal } = req.body;

    if (!mealType || !meal) {
      throw new AppError("mealType and meal data are required", 400);
    }

    const updateQuery: Record<string, any> = {};
    updateQuery[mealType] = meal;

    const plan = await MealPlanModel.findOneAndUpdate(
      { userId, date },
      { $set: updateQuery },
      { new: true, upsert: true }
    );

    return apiResponse(res, 200, true, "Meal updated successfully", plan);
  } catch (error) {
    next(error);
  }
});

// --- GROCERY LIST ---
router.get("/grocery", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { startDate, endDate, all } = req.query;

    if (all === "true" || (!startDate && !endDate)) {
      const lists = await GroceryListModel.find({ userId }).sort({ updatedAt: -1 });
      return apiResponse(res, 200, true, "Grocery lists loaded", lists);
    }

    if (!startDate || !endDate) {
      throw new AppError("startDate and endDate are required", 400);
    }

    let groceryList = await GroceryListModel.findOne({
      userId,
      startDate: String(startDate),
      endDate: String(endDate),
    });

    if (!groceryList) {
      // Automatically generate
      const plans = await MealPlanModel.find({
        userId,
        date: { $gte: String(startDate), $lte: String(endDate) },
      });

      const aggregatedItems: Record<string, { name: string; quantity: number; unit: string; category: string }> = {};

      for (const plan of plans) {
        const slots = [plan.breakfast, plan.lunch, plan.snack, plan.dinner];
        for (const slot of slots) {
          if (slot && typeof slot.recipeId === "string" && slot.recipeId) {
            // Fetch ingredients of the recipe to aggregate
            const recipe = await recipeRepository.findById(slot.recipeId);
            if (recipe) {
              for (const ing of recipe.ingredients) {
                const key = ing.name.trim().toLowerCase();
                if (aggregatedItems[key]) {
                  aggregatedItems[key].quantity += (ing.quantity || 1) * slot.servings;
                } else {
                  aggregatedItems[key] = {
                    name: ing.name,
                    quantity: (ing.quantity || 1) * slot.servings,
                    unit: ing.unit || "g",
                    category: recipe.category || "Other"
                  };
                }
              }
            }
          }
        }
      }

      groceryList = new GroceryListModel({
        userId,
        title: `Meal Plan (${startDate} to ${endDate})`,
        startDate,
        endDate,
        items: Object.values(aggregatedItems).map(item => ({ ...item, purchased: false })),
      });
      await groceryList.save();
    }

    return apiResponse(res, 200, true, "Grocery list loaded", groceryList);
  } catch (error) {
    next(error);
  }
});

router.post("/grocery", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("UNAUTHORIZED", 401);
    }
    const { title, items, recipeId } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const groceryList = new GroceryListModel({
      userId,
      title: title || "New Grocery List",
      recipeId: recipeId || undefined,
      startDate: today,
      endDate: today,
      items: items || [],
    });
    await groceryList.save();

    return apiResponse(res, 201, true, "Grocery list created", groceryList);
  } catch (error) {
    next(error);
  }
});

router.post("/grocery/generate", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("UNAUTHORIZED", 401);
    }
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      throw new AppError("startDate and endDate are required", 400);
    }

    const plans = await MealPlanModel.find({
      userId,
      date: { $gte: String(startDate), $lte: String(endDate) },
    });

    const aggregatedItems: Record<string, { name: string; quantity: number; unit: string; category: string }> = {};

    for (const plan of plans) {
      const slots = [plan.breakfast, plan.lunch, plan.snack, plan.dinner];
      for (const slot of slots) {
        if (slot && typeof slot.recipeId === "string" && slot.recipeId) {
          const recipe = await recipeRepository.findById(slot.recipeId);
          if (recipe) {
            for (const ing of recipe.ingredients) {
              const key = ing.name.trim().toLowerCase();
              if (aggregatedItems[key]) {
                aggregatedItems[key].quantity += (ing.quantity || 1) * slot.servings;
              } else {
                aggregatedItems[key] = {
                  name: ing.name,
                  quantity: (ing.quantity || 1) * slot.servings,
                  unit: ing.unit || "g",
                  category: recipe.category || "Other"
                };
              }
            }
          }
        }
      }
    }

    const groceryList = await GroceryListModel.findOneAndUpdate(
      { userId, startDate, endDate },
      {
        $set: {
          items: Object.values(aggregatedItems).map(item => ({ ...item, purchased: false })),
        },
      },
      { new: true, upsert: true }
    );

    await notificationService.createNotification(
      userId,
      "Grocery List Ready",
      "Grocery List Ready",
      "Your grocery list has been generated.",
      undefined,
      undefined
    );

    return apiResponse(res, 200, true, "Grocery list generated", groceryList);
  } catch (error) {
    next(error);
  }
});

router.get("/grocery/:id", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { id } = req.params;

    const list = await GroceryListModel.findOne({ _id: id, userId });
    if (!list) {
      throw new AppError("Grocery list not found", 404);
    }

    return apiResponse(res, 200, true, "Grocery list loaded", list);
  } catch (error) {
    next(error);
  }
});

router.put("/grocery/:id", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { id } = req.params;
    const { title, items } = req.body;

    const updateQuery: Record<string, any> = {};
    if (title !== undefined) updateQuery.title = title;
    if (items !== undefined) updateQuery.items = items;

    const list = await GroceryListModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updateQuery },
      { new: true }
    );

    if (!list) {
      throw new AppError("Grocery list not found", 404);
    }

    return apiResponse(res, 200, true, "Grocery list updated", list);
  } catch (error) {
    next(error);
  }
});

router.delete("/grocery/:id", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    const { id } = req.params;

    const list = await GroceryListModel.findOneAndDelete({ _id: id, userId });
    if (!list) {
      throw new AppError("Grocery list not found", 404);
    }

    return apiResponse(res, 200, true, "Grocery list deleted", { id });
  } catch (error) {
    next(error);
  }
});

export default router;
