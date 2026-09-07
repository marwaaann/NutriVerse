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

router.post("/onboarding", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const {
      height,
      heightUnit = "cm",
      weight,
      weightUnit = "kg",
      age,
      gender,
      activityLevel = "Moderately Active",
      healthGoal,
      dietaryPreference = "Non-Vegetarian",
      allergies = [],
      foodPreferences = [],
      preferredCuisines = [],
      mealsPerDay = 3,
    } = req.body;

    if (!height || Number(height) <= 0) {
      throw new AppError("Please provide a valid positive height", 400);
    }
    if (!weight || Number(weight) <= 0) {
      throw new AppError("Please provide a valid positive weight", 400);
    }
    if (!age || Number(age) <= 0) {
      throw new AppError("Please provide a valid positive age", 400);
    }

    const numHeight = Number(height);
    const numWeight = Number(weight);
    const numAge = Number(age);

    // Calculate BMI on backend
    const hM = heightUnit === "ft/in" ? numHeight * 0.0254 : numHeight / 100;
    const wKg = weightUnit === "lbs" ? numWeight * 0.45359237 : numWeight;
    const bmi = Math.round((wKg / (hM * hM)) * 10) / 10;

    let bmiCategory: "Underweight" | "Normal Weight" | "Overweight" | "Obese";
    if (bmi < 18.5) {
      bmiCategory = "Underweight";
    } else if (bmi < 25.0) {
      bmiCategory = "Normal Weight";
    } else if (bmi < 30.0) {
      bmiCategory = "Overweight";
    } else {
      bmiCategory = "Obese";
    }

    // Calculate safe daily calorie target using Mifflin-St Jeor
    let bmr = 10 * wKg + 6.25 * (hM * 100) - 5 * numAge;
    if (gender === "Male") bmr += 5;
    else if (gender === "Female") bmr -= 161;
    else bmr -= 78;

    const act = (activityLevel || "").toLowerCase();
    let factor = 1.55;
    if (act.includes("sedentary")) factor = 1.2;
    else if (act.includes("light")) factor = 1.375;
    else if (act.includes("very")) factor = 1.725;
    else if (act.includes("extremely")) factor = 1.9;

    let tdee = Math.round(bmr * factor);
    const goalLower = (healthGoal || "").toLowerCase();
    if (goalLower.includes("loss") || goalLower.includes("reduce") || bmiCategory === "Overweight" || bmiCategory === "Obese") {
      tdee = Math.max(gender === "Female" ? 1250 : 1500, tdee - 400);
    } else if (goalLower.includes("gain") || bmiCategory === "Underweight") {
      tdee += 350;
    }
    const dailyCalorieTarget = tdee;

    // Update User Document
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          height: numHeight,
          heightUnit,
          weight: numWeight,
          weightUnit,
          age: numAge,
          gender,
          activityLevel,
          bmi,
          bmiCategory,
          healthGoal,
          dietaryPreference,
          allergies: Array.isArray(allergies) ? allergies : [],
          foodPreferences: Array.isArray(foodPreferences) ? foodPreferences : [],
          preferredCuisines: Array.isArray(preferredCuisines) ? preferredCuisines : [],
          mealsPerDay: Number(mealsPerDay) || 3,
          dailyCalorieTarget,
          onboardingCompleted: true,
        },
      },
      { new: true }
    );

    // Sync UserPreferencesModel
    await UserPreferencesModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          cuisines: preferredCuisines.length > 0 ? preferredCuisines : ["Indian"],
          diet: dietaryPreference,
          nonVegPreference: dietaryPreference === "Non-Vegetarian" ? ["Chicken", "Eggs"] : [],
          allergies: Array.isArray(allergies) ? allergies : [],
          healthGoals: healthGoal ? [healthGoal] : [],
          mealTypes: Number(mealsPerDay) >= 4 ? ["breakfast", "lunch", "snack", "dinner"] : ["breakfast", "lunch", "dinner"],
        },
      },
      { upsert: true, new: true }
    );

    // Generate Initial Meal Plans for Today, Tomorrow, Day After
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now() + 172800000).toISOString().split("T")[0];

    const dates = [today, tomorrow, dayAfter];
    const preferencesContext = {
      userPreferences: {
        cuisines: preferredCuisines,
        diet: dietaryPreference,
        allergies,
        healthGoals: [healthGoal],
        mealsPerDay,
        bmi,
        bmiCategory,
        dailyCalorieTarget,
        activityLevel
      },
      householdMembers: []
    };

    const availableRecipes = await recipeRepository.findByAuthorId(userId, 50, 0);

    const generatedPlans = [];
    for (const d of dates) {
      try {
        const plan = await aiService.generateMealPlan(preferencesContext, availableRecipes, d);
        const saved = await MealPlanModel.findOneAndUpdate(
          { userId, date: d },
          {
            $set: {
              breakfast: plan.breakfast,
              lunch: plan.lunch,
              snack: plan.snack,
              dinner: plan.dinner,
            },
          },
          { upsert: true, new: true }
        );
        generatedPlans.push(saved);
      } catch (planErr) {
        logger.warn(`Failed to generate plan for ${d}:`, planErr);
      }
    }

    // Create a welcome notification
    try {
      await notificationService.createNotification(
        userId,
        "system",
        "Welcome to NutriVerse! 👋",
        `Your personalized plan for ${bmiCategory} (BMI: ${bmi}) is ready!`
      );
    } catch {
      // non-blocking
    }

    return apiResponse(res, 200, true, "Onboarding completed successfully", {
      user: updatedUser,
      bmi,
      bmiCategory,
      dailyCalorieTarget,
      plans: generatedPlans
    });
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

    // 2b. Gather dishes already planned around this date to enforce zero repetition
    let avoidDishes: string[] = Array.isArray(req.body.avoidDishes) ? req.body.avoidDishes : [];
    if (avoidDishes.length === 0) {
      const recentPlans = await MealPlanModel.find({ userId, date: { $ne: date } }).sort({ date: -1 }).limit(7);
      const dishesSet = new Set<string>();
      for (const p of recentPlans) {
        if (p.breakfast?.title) dishesSet.add(p.breakfast.title);
        if (p.lunch?.title) dishesSet.add(p.lunch.title);
        if (p.snack?.title) dishesSet.add(p.snack.title);
        if (p.dinner?.title) dishesSet.add(p.dinner.title);
      }
      avoidDishes = Array.from(dishesSet);
    }

    // 3. Request AI plan generation
    const aiPlan = await aiService.generateMealPlan(preferencesContext, availableRecipes, date, avoidDishes);

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

router.post("/plan/generate-week", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("UNAUTHORIZED", 401);
    }
    const { startDate, silent } = req.body;
    const baseDate = startDate ? new Date(startDate) : new Date();

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
    const availableRecipes = await recipeRepository.findByAuthorId(userId, 50, 0);

    const savedPlans: any[] = [];
    const accumulatedDishes: string[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + dayOffset);
      const currDateStr = d.toISOString().split("T")[0];

      const aiPlan = await aiService.generateMealPlan(preferencesContext, availableRecipes, currDateStr, accumulatedDishes);

      const saved = await MealPlanModel.findOneAndUpdate(
        { userId, date: currDateStr },
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
      savedPlans.push(saved);

      if (aiPlan.breakfast?.title) accumulatedDishes.push(aiPlan.breakfast.title);
      if (aiPlan.lunch?.title) accumulatedDishes.push(aiPlan.lunch.title);
      if (aiPlan.snack?.title) accumulatedDishes.push(aiPlan.snack.title);
      if (aiPlan.dinner?.title) accumulatedDishes.push(aiPlan.dinner.title);
    }

    if (!silent) {
      await notificationService.createNotification(
        userId,
        "Weekly Meal Plan Ready",
        "Weekly Meal Plan Ready",
        "Your personalized 7-day varied meal plan is ready to review."
      );
    }

    return apiResponse(res, 200, true, "7-day meal plan generated successfully", savedPlans);
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
const cleanDishName = (name: string): string => {
  if (!name) return "";
  return name
    .replace(/^AI Fallback:\s*/i, "")
    .replace(/^AI Fallback\s*/i, "")
    .replace(/^Fallback:\s*/i, "")
    .replace(/^Fallback\s*/i, "")
    .trim();
};

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
      const unmappedDishTitles: { title: string; servings: number }[] = [];

      for (const plan of plans) {
        const slots = [plan.breakfast, plan.lunch, plan.snack, plan.dinner];
        for (const slot of slots) {
          if (slot) {
            let found = false;
            if (slot.recipeId && mongoose.isValidObjectId(slot.recipeId)) {
              const recipe = await recipeRepository.findById(slot.recipeId);
              if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
                found = true;
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
            if (!found && slot.title) {
              unmappedDishTitles.push({ title: slot.title, servings: slot.servings || 1 });
            }
          }
        }
      }

      if (unmappedDishTitles.length > 0) {
        const titles = unmappedDishTitles.map(u => u.title);
        const dishIngredients = await aiService.generateIngredientsForDishes(titles);
        for (const ing of dishIngredients) {
          const key = ing.name.trim().toLowerCase();
          const qty = Number(ing.quantity) || 1;
          if (aggregatedItems[key]) {
            aggregatedItems[key].quantity += qty;
          } else {
            aggregatedItems[key] = {
              name: ing.name.trim(),
              quantity: qty,
              unit: ing.unit || "units",
              category: ing.category || "Other"
            };
          }
        }
      }

      groceryList = new GroceryListModel({
        userId,
        title: `Meal Plan (${startDate} to ${endDate})`,
        startDate,
        endDate,
        items: Object.values(aggregatedItems).map(item => ({
          name: item.name,
          quantity: Math.round(item.quantity * 10) / 10,
          unit: item.unit,
          category: item.category,
          purchased: false
        })),
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

router.post("/grocery/from-meals", async (req: Request, res: Response, next) => {
  try {
    const userId = req.user?.user_Id;
    if (!userId) {
      throw new AppError("UNAUTHORIZED", 401);
    }
    const { title, meals, startDate, endDate } = req.body;

    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      throw new AppError("meals array with at least one meal is required", 400);
    }

    const aggregatedItems: Record<string, { name: string; quantity: number; unit: string; category: string }> = {};
    const unmappedDishTitles: { title: string; servings: number }[] = [];

    for (const meal of meals) {
      const servings = Number(meal.servings) || 1;
      let foundRecipe = null;
      if (meal.recipeId && mongoose.isValidObjectId(meal.recipeId)) {
        foundRecipe = await recipeRepository.findById(meal.recipeId);
      }

      if (foundRecipe && foundRecipe.ingredients && foundRecipe.ingredients.length > 0) {
        for (const ing of foundRecipe.ingredients) {
          const key = ing.name.trim().toLowerCase();
          const qty = (Number(ing.quantity) || 1) * servings;
          if (aggregatedItems[key]) {
            aggregatedItems[key].quantity += qty;
          } else {
            aggregatedItems[key] = {
              name: ing.name.trim(),
              quantity: qty,
              unit: ing.unit || "units",
              category: foundRecipe.category || "Other",
            };
          }
        }
      } else if (meal.title) {
        unmappedDishTitles.push({ title: meal.title, servings });
      }
    }

    if (unmappedDishTitles.length > 0) {
      const titles = unmappedDishTitles.map(u => u.title);
      const dishIngredients = await aiService.generateIngredientsForDishes(titles);
      for (const ing of dishIngredients) {
        const key = ing.name.trim().toLowerCase();
        const qty = Number(ing.quantity) || 1;
        if (aggregatedItems[key]) {
          aggregatedItems[key].quantity += qty;
        } else {
          aggregatedItems[key] = {
            name: ing.name.trim(),
            quantity: qty,
            unit: ing.unit || "units",
            category: ing.category || "Other",
          };
        }
      }
    }

    const today = new Date().toISOString().split("T")[0];
    const cleanNames = meals.map((m: any) => cleanDishName(m.title)).filter(Boolean);
    const defaultTitle = cleanNames.length === 1
      ? `Grocery: ${cleanNames[0]}`
      : `Grocery: ${cleanNames.slice(0, 2).join(" & ")}${cleanNames.length > 2 ? ` (+${cleanNames.length - 2} more)` : ""}`;

    const groceryList = new GroceryListModel({
      userId,
      title: title || defaultTitle,
      startDate: startDate || today,
      endDate: endDate || today,
      items: Object.values(aggregatedItems).map(item => ({
        name: item.name,
        quantity: Math.round(item.quantity * 10) / 10,
        unit: item.unit,
        category: item.category,
        purchased: false,
      })),
    });

    await groceryList.save();

    await notificationService.createNotification(
      userId,
      "Grocery List Created",
      "Grocery List Created",
      `Grocery list with ${groceryList.items.length} items created for ${meals.length} meal(s).`,
      undefined,
      groceryList._id?.toString()
    );

    return apiResponse(res, 201, true, "Grocery list created successfully", groceryList);
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
    const unmappedDishTitles: { title: string; servings: number }[] = [];

    for (const plan of plans) {
      const slots = [plan.breakfast, plan.lunch, plan.snack, plan.dinner];
      for (const slot of slots) {
        if (slot) {
          let found = false;
          if (slot.recipeId && mongoose.isValidObjectId(slot.recipeId)) {
            const recipe = await recipeRepository.findById(slot.recipeId);
            if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
              found = true;
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
          if (!found && slot.title) {
            unmappedDishTitles.push({ title: slot.title, servings: slot.servings || 1 });
          }
        }
      }
    }

    if (unmappedDishTitles.length > 0) {
      const titles = unmappedDishTitles.map(u => u.title);
      const dishIngredients = await aiService.generateIngredientsForDishes(titles);
      for (const ing of dishIngredients) {
        const key = ing.name.trim().toLowerCase();
        const qty = Number(ing.quantity) || 1;
        if (aggregatedItems[key]) {
          aggregatedItems[key].quantity += qty;
        } else {
          aggregatedItems[key] = {
            name: ing.name.trim(),
            quantity: qty,
            unit: ing.unit || "units",
            category: ing.category || "Other"
          };
        }
      }
    }

    const groceryList = await GroceryListModel.findOneAndUpdate(
      { userId, startDate, endDate },
      {
        $set: {
          items: Object.values(aggregatedItems).map(item => ({
            name: item.name,
            quantity: Math.round(item.quantity * 10) / 10,
            unit: item.unit,
            category: item.category,
            purchased: false,
          })),
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
