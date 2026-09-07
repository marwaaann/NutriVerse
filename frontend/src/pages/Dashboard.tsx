import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axiosInstance from "../api/axiosInstance";
import { showToast } from "../utils/toast";
import { 
  Flame, 
  Activity, 
  Sparkles, 
  RotateCw, 
  ShoppingCart, 
  MessageSquare, 
  Plus, 
  HelpCircle,
  Video,
  CheckSquare,
  Square,
  MessageCircle,
  Scale,
  Target,
  ChevronRight,
  CheckCircle2
} from "lucide-react";

interface MealSlot {
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

interface MealPlan {
  _id?: string;
  date: string;
  breakfast?: MealSlot;
  lunch?: MealSlot;
  snack?: MealSlot;
  dinner?: MealSlot;
}

const cleanDishName = (name: string): string => {
  if (!name) return "";
  return name
    .replace(/^AI Fallback:\s*/i, "")
    .replace(/^AI Fallback\s*/i, "")
    .replace(/^Fallback:\s*/i, "")
    .replace(/^Fallback\s*/i, "")
    .trim();
};

export const Dashboard: React.FC = () => {
  const { data: user } = useAuth();
  const navigate = useNavigate();

  // Selected date state (defaults to today YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [mealPlans, setMealPlans] = useState<Record<string, MealPlan>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingWeek, setIsGeneratingWeek] = useState(false);
  const [isGroceryLoading, setIsGroceryLoading] = useState(false);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  
  // Swapping states
  const [swappingSlot, setSwappingSlot] = useState<{ date: string; mealType: string; currentMeal: MealSlot } | null>(null);
  const [swapAlternatives, setSwapAlternatives] = useState<MealSlot[]>([]);
  const [isAlternativesLoading, setIsAlternativesLoading] = useState(false);

  // Clear selected meals when switching date
  useEffect(() => {
    setSelectedMealTypes([]);
  }, [selectedDate]);

  // Load plans for the next 7 days
  const loadMealPlans = async () => {
    setIsLoading(true);
    try {
      const dates = Array.from({ length: 7 }).map((_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() + idx);
        return d.toISOString().split("T")[0];
      });
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      const response = await axiosInstance.get(`/api/mealplanner/plan/range?startDate=${startDate}&endDate=${endDate}`);
      const plansArray: MealPlan[] = response.data.data;

      const plansMap: Record<string, MealPlan> = {};
      plansArray.forEach(plan => {
        plansMap[plan.date] = plan;
      });
      setMealPlans(plansMap);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to load meal plans.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMealPlans();
  }, []);

  const handleGeneratePlan = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/api/mealplanner/plan/generate", { date });
      const updatedPlan: MealPlan = response.data.data;
      setMealPlans(prev => ({
        ...prev,
        [date]: updatedPlan
      }));
      showToast.success(`Meal plan generated for ${date}!`);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to generate AI meal plan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWeekPlan = async () => {
    setIsGeneratingWeek(true);
    try {
      const response = await axiosInstance.post("/api/mealplanner/plan/generate-week", {
        startDate: todayStr,
      });
      const generatedPlans: MealPlan[] = response.data.data;
      const plansMap: Record<string, MealPlan> = { ...mealPlans };
      generatedPlans.forEach(plan => {
        plansMap[plan.date] = plan;
      });
      setMealPlans(plansMap);
      showToast.success("7-Day varied meal plan generated!");
    } catch (err) {
      console.error(err);
      showToast.error("Failed to generate weekly meal plan.");
    } finally {
      setIsGeneratingWeek(false);
    }
  };

  const handleOpenSwap = async (date: string, mealType: string, currentMeal: MealSlot) => {
    setSwappingSlot({ date, mealType, currentMeal });
    setIsAlternativesLoading(true);
    try {
      const response = await axiosInstance.post(`/api/mealplanner/plan/${date}/swap`, {
        mealType,
        currentMeal
      });
      setSwapAlternatives(response.data.data);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to fetch alternative suggestions.");
    } finally {
      setIsAlternativesLoading(false);
    }
  };

  const handleSelectAlternative = async (alternative: MealSlot) => {
    if (!swappingSlot) return;
    const { date, mealType } = swappingSlot;

    try {
      const response = await axiosInstance.put(`/api/mealplanner/plan/${date}`, {
        mealType,
        meal: alternative
      });
      const updatedPlan: MealPlan = response.data.data;
      setMealPlans(prev => ({
        ...prev,
        [date]: updatedPlan
      }));
      setSwappingSlot(null);
      setSwapAlternatives([]);
      showToast.success("Meal updated successfully!");
    } catch (err) {
      console.error(err);
      showToast.error("Failed to swap meal.");
    }
  };

  const handleAddToGrocery = async (meal: MealSlot) => {
    setIsGroceryLoading(true);
    try {
      const cleanTitle = cleanDishName(meal.title);
      const response = await axiosInstance.post("/api/mealplanner/grocery/from-meals", {
        title: `Grocery: ${cleanTitle}`,
        meals: [{ title: meal.title, servings: meal.servings || 2, recipeId: meal.recipeId }],
        startDate: selectedDate,
        endDate: selectedDate
      });
      const list = response.data.data;
      showToast.success(`Ingredients for "${cleanTitle}" added to grocery list!`);
      navigate(`/grocery?listId=${list._id}`);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to add to grocery list.");
    } finally {
      setIsGroceryLoading(false);
    }
  };

  const toggleMealSelection = (mealType: string) => {
    setSelectedMealTypes(prev =>
      prev.includes(mealType) ? prev.filter(t => t !== mealType) : [...prev, mealType]
    );
  };

  const handleSelectAllMeals = () => {
    if (!activePlan) return;
    const available = ["breakfast", "lunch", "snack", "dinner"].filter(
      type => Boolean(activePlan[type as keyof MealPlan])
    );
    if (selectedMealTypes.length === available.length) {
      setSelectedMealTypes([]);
    } else {
      setSelectedMealTypes(available);
    }
  };

  const handleBuySelectedGrocery = async () => {
    if (!activePlan || selectedMealTypes.length === 0) return;
    setIsGroceryLoading(true);
    try {
      const mealsToBuy = selectedMealTypes
        .map(type => activePlan[type as keyof MealPlan] as MealSlot | undefined)
        .filter((m): m is MealSlot => Boolean(m));

      if (mealsToBuy.length === 0) return;

      const cleanTitles = mealsToBuy.map(m => cleanDishName(m.title));
      const title = mealsToBuy.length === 1
        ? `Grocery: ${cleanTitles[0]}`
        : `Grocery: ${cleanTitles.slice(0, 2).join(" & ")}${cleanTitles.length > 2 ? ` (+${cleanTitles.length - 2} more)` : ""}`;

      const response = await axiosInstance.post("/api/mealplanner/grocery/from-meals", {
        title,
        meals: mealsToBuy.map(m => ({
          title: m.title,
          servings: m.servings || 2,
          recipeId: m.recipeId
        })),
        startDate: selectedDate,
        endDate: selectedDate
      });
      const list = response.data.data;
      showToast.success(`Added ${list.items?.length || 0} ingredients for ${mealsToBuy.length} meal(s)!`);
      navigate(`/grocery?listId=${list._id}`);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to generate grocery list for selected meals.");
    } finally {
      setIsGroceryLoading(false);
    }
  };

  const handleShareSelectedWhatsApp = async () => {
    if (!activePlan || selectedMealTypes.length === 0) return;
    setIsGroceryLoading(true);
    try {
      const mealsToBuy = selectedMealTypes
        .map(type => activePlan[type as keyof MealPlan] as MealSlot | undefined)
        .filter((m): m is MealSlot => Boolean(m));

      if (mealsToBuy.length === 0) return;

      const cleanTitles = mealsToBuy.map(m => cleanDishName(m.title));
      const title = mealsToBuy.length === 1
        ? `Grocery: ${cleanTitles[0]}`
        : `Grocery: ${cleanTitles.slice(0, 2).join(" & ")}${cleanTitles.length > 2 ? ` (+${cleanTitles.length - 2} more)` : ""}`;

      const response = await axiosInstance.post("/api/mealplanner/grocery/from-meals", {
        title,
        meals: mealsToBuy.map(m => ({
          title: m.title,
          servings: m.servings || 2,
          recipeId: m.recipeId
        })),
        startDate: selectedDate,
        endDate: selectedDate
      });
      const list = response.data.data;
      const items: any[] = list.items || [];

      let message = `🛒 *NutriVerse Shopping List* (${mealsToBuy.length} Dishes: ${cleanTitles.join(" & ")})\n\n`;
      message += `*REQUIRED INGREDIENTS (${items.length}):*\n`;
      items.forEach((item) => {
        message += `☐ ${item.name} (${item.quantity} ${item.unit})\n`;
      });
      message += `\nGenerated by NutriVerse Assistant`;

      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      showToast.success(`Opened WhatsApp for ${mealsToBuy.length} dish(es)!`);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to share grocery list for selected meals.");
    } finally {
      setIsGroceryLoading(false);
    }
  };

  const handleTriggerChat = (mealTitle: string) => {
    window.dispatchEvent(
      new CustomEvent("open-recipe-chatbot", {
        detail: {
          query: `Tell me about the recipe for ${cleanDishName(mealTitle)}`,
          autoSend: true,
        },
      })
    );
  };

  // Generate Date Buttons for Selection
  const dateButtons = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === todayStr;
    const isTomorrow = dateStr === new Date(Date.now() + 86400000).toISOString().split("T")[0];
    
    let label = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
    if (isToday) label = "Today";
    if (isTomorrow) label = "Tomorrow";

    return { dateStr, label };
  });

  const activePlan = mealPlans[selectedDate];

  // Aggregated nutrients for active day
  const dailyCalories = 
    (activePlan?.breakfast?.calories || 0) +
    (activePlan?.lunch?.calories || 0) +
    (activePlan?.snack?.calories || 0) +
    (activePlan?.dinner?.calories || 0);

  const dailyProtein = 
    (activePlan?.breakfast?.protein || 0) +
    (activePlan?.lunch?.protein || 0) +
    (activePlan?.snack?.protein || 0) +
    (activePlan?.dinner?.protein || 0);

  const dailyCarbs = 
    (activePlan?.breakfast?.carbs || 0) +
    (activePlan?.lunch?.carbs || 0) +
    (activePlan?.snack?.carbs || 0) +
    (activePlan?.dinner?.carbs || 0);

  const dailyFat = 
    (activePlan?.breakfast?.fat || 0) +
    (activePlan?.lunch?.fat || 0) +
    (activePlan?.snack?.fat || 0) +
    (activePlan?.dinner?.fat || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            What are we cooking today, {user?.fullname?.split(" ")[0] || "Marwan"}? 👋
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Personalized family meal planning powered by NutriVerse AI.
          </p>
        </div>

        {/* Quick actions panel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateWeekPlan}
            disabled={isGeneratingWeek}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold border border-amber-200/60 dark:border-amber-900/60 transition cursor-pointer disabled:opacity-50"
            title="Generate a fresh, non-repeating 7-day meal plan based on your preferences"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isGeneratingWeek ? "animate-spin text-amber-600" : "text-amber-600 dark:text-amber-400"}`} />
            <span>{isGeneratingWeek ? "Generating Week..." : "Refresh Week Plan"}</span>
          </button>
          <Link
            to="/recipes/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition"
          >
            <Plus className="h-4 w-4" /> Add Recipe
          </Link>
          <Link
            to="/chat"
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> Ask AI
          </Link>
        </div>
      </div>

      {/* Real-Time BMI & Caloric Health Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* BMI Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Scale className="h-4 w-4 text-amber-500" /> Body Mass Index
            </span>
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
              user?.bmiCategory === "Underweight" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900" :
              user?.bmiCategory === "Normal Weight" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900" :
              user?.bmiCategory === "Overweight" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900" :
              "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
            }`}>
              {user?.bmiCategory || "Normal Weight"}
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-zinc-900 dark:text-white flex items-baseline gap-2">
              {user?.bmi || 22.5}
              <span className="text-xs font-semibold text-zinc-400">
                ({user?.weight || 68} {user?.weightUnit || "kg"})
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span>Height: {user?.height || 170} {user?.heightUnit || "cm"}</span>
            <Link to="/profile" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold flex items-center gap-0.5">
              Profile <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Real-time Calorie Target & Planned Meter */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="h-4 w-4 text-orange-500" /> Daily Calories
            </span>
            <span className="text-[10px] font-black bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900">
              {dailyCalories > 0 ? `${Math.round((dailyCalories / (user?.dailyCalorieTarget || 2000)) * 100)}% Target` : "Awaiting Plan"}
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-zinc-900 dark:text-white flex items-baseline gap-1.5">
              {dailyCalories}
              <span className="text-sm font-bold text-zinc-400">
                / {user?.dailyCalorieTarget || 2000} kcal
              </span>
            </div>
            {/* Real-time progress bar */}
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  dailyCalories > (user?.dailyCalorieTarget || 2000) + 150
                    ? "bg-rose-500"
                    : dailyCalories >= (user?.dailyCalorieTarget || 2000) - 150
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, Math.round((dailyCalories / (user?.dailyCalorieTarget || 2000)) * 100))}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
            <span>
              {dailyCalories === 0 ? "No meals planned" :
               dailyCalories > (user?.dailyCalorieTarget || 2000) ? `+${dailyCalories - (user?.dailyCalorieTarget || 2000)} kcal surplus` :
               `${(user?.dailyCalorieTarget || 2000) - dailyCalories} kcal remaining`}
            </span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {selectedDate === todayStr ? "Today's Target" : selectedDate}
            </span>
          </div>
        </div>

        {/* Health Goal & Dietary Track Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="h-4 w-4 text-emerald-500" /> Active Goal
            </span>
            <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              {user?.activityLevel || "Active"}
            </span>
          </div>
          <div className="my-2">
            <h4 className="text-base font-black text-zinc-900 dark:text-white line-clamp-1">
              {user?.healthGoal || "Maintain Current Weight"}
            </h4>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-1">
              🥗 {user?.dietaryPreference || "Non-Vegetarian"}
              {user?.allergies && user.allergies.length > 0 && ` • ${user.allergies.length} allergy filter${user.allergies.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
            <span>{user?.mealsPerDay || 3} meals / day</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Personalized
            </span>
          </div>
        </div>
      </div>

      {/* Date selector calendar slider */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-6">
        {dateButtons.map(({ dateStr, label }) => (
          <button
            key={dateStr}
            onClick={() => setSelectedDate(dateStr)}
            className={`px-6 py-3 rounded-2xl text-sm font-bold flex-shrink-0 transition-all ${
              selectedDate === dateStr
                ? "bg-amber-500 text-white shadow-md scale-105"
                : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Meal cards column */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
              ))}
            </div>
          ) : !activePlan ? (
            // Empty state personalization trigger
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-8 rounded-3xl text-center space-y-4">
              <span className="text-4xl">🍳</span>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Let's plan your first meals!</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                No active meal plan exists for this date. Click generate to have Gemini build one matching your household allergies.
              </p>
              <button
                onClick={() => handleGeneratePlan(selectedDate)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-2xl shadow-sm transition"
              >
                Generate Family Meal Plan
              </button>
            </div>
          ) : (
            // Meal plan items list
            <div className="space-y-6">
              {/* Multi-Meal Grocery Action Bar */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAllMeals}
                    className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                  >
                    {selectedMealTypes.length > 0 &&
                    selectedMealTypes.length ===
                      ["breakfast", "lunch", "snack", "dinner"].filter(t => Boolean(activePlan[t as keyof MealPlan])).length ? (
                      <CheckSquare className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-400" />
                    )}
                    <span>
                      {selectedMealTypes.length > 0 ? "Deselect All Meals" : "Select Multiple Meals"}
                    </span>
                  </button>
                  {selectedMealTypes.length > 0 && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full">
                      {selectedMealTypes.length} meal{selectedMealTypes.length > 1 ? "s" : ""} selected
                    </span>
                  )}
                </div>

                {selectedMealTypes.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleBuySelectedGrocery}
                      disabled={isGroceryLoading}
                      className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer hover:scale-105 duration-150"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>
                        {isGroceryLoading
                          ? "Creating List..."
                          : `Buy Grocery (${selectedMealTypes.length})`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareSelectedWhatsApp}
                      disabled={isGroceryLoading}
                      className="flex items-center gap-2 px-3.5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer hover:scale-105 duration-150"
                      title="Share grocery list for selected meals on WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {selectedMealTypes.length === 2
                          ? "Share Both on WhatsApp"
                          : `Share on WhatsApp (${selectedMealTypes.length})`}
                      </span>
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400">
                    Tip: Select breakfast & lunch together to build a combined grocery list
                  </p>
                )}
              </div>

              {["breakfast", "lunch", "snack", "dinner"].map((mealType) => {
                const meal = activePlan[mealType as keyof MealPlan] as MealSlot | undefined;
                if (!meal) return null;

                const isSelected = selectedMealTypes.includes(mealType);

                return (
                  <div 
                    key={mealType} 
                    className={`bg-white dark:bg-zinc-900 border p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition duration-200 ${
                      isSelected
                        ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20"
                        : "border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleMealSelection(mealType)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-amber-50 dark:bg-amber-900/30 border-transparent text-amber-700 dark:text-amber-400 hover:border-amber-300"
                          }`}
                          title={`Select ${mealType} for multi-meal grocery buying`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-3.5 w-3.5" />
                          ) : (
                            <Square className="h-3.5 w-3.5 opacity-60" />
                          )}
                          <span className="uppercase tracking-wider">{mealType}</span>
                        </button>
                        {meal.calories > 400 && (
                          <span className="text-[10px] font-semibold bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Activity className="h-3 w-3" /> High Protein
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{cleanDishName(meal.title)}</h3>
                      
                      {meal.reason && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{meal.reason}</span>
                        </p>
                      )}

                      {/* Macronutrients stats */}
                      <div className="flex gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-amber-500" /> {meal.calories} kcal</span>
                        <span>Protein: {meal.protein}g</span>
                        <span>Carbs: {meal.carbs}g</span>
                        <span>Fat: {meal.fat}g</span>
                      </div>
                    </div>

                    {/* Meal actions */}
                    <div className="flex flex-row md:flex-col justify-end items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-50 dark:border-zinc-800">
                      {meal.recipeId ? (
                        <Link
                          to={`/recipes/${meal.recipeId}`}
                          className="flex-1 md:flex-initial text-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 font-bold rounded-xl text-xs transition"
                        >
                          View Recipe
                        </Link>
                      ) : (
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(meal.title + " recipe")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 md:flex-initial text-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition"
                        >
                          <Video className="h-3.5 w-3.5" /> Video
                        </a>
                      )}

                      <button
                        onClick={() => handleOpenSwap(selectedDate, mealType, meal)}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1 px-4 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-xs transition"
                      >
                        <RotateCw className="h-3 w-3" /> Swap
                      </button>

                      <button
                        onClick={() => handleAddToGrocery(meal)}
                        disabled={isGroceryLoading}
                        title="Add to grocery list and view"
                        className="p-2 bg-zinc-50 hover:bg-amber-50 dark:bg-zinc-800 dark:hover:bg-amber-950/30 text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 rounded-xl transition cursor-pointer"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleTriggerChat(meal.title)}
                        title="Ask AI recipe details"
                        className="p-2 bg-zinc-50 hover:bg-amber-50 dark:bg-zinc-800 dark:hover:bg-amber-950/30 text-zinc-600 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 rounded-xl transition cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Summary Info panel */}
        <div className="space-y-6">
          {/* Swapping alternative options modal panel */}
          {swappingSlot && (
            <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 p-6 rounded-3xl shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-lg text-zinc-950 dark:text-white flex items-center gap-2">
                  <RotateCw className="h-4.5 w-4.5 text-amber-500 animate-spin" /> Swap Alternatives
                </h3>
                <button 
                  onClick={() => { setSwappingSlot(null); setSwapAlternatives([]); }}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-600"
                >
                  Cancel
                </button>
              </div>

              {isAlternativesLoading ? (
                <div className="py-8 text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
                  <p className="text-xs text-zinc-500">Asking Gemini for swaps...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {swapAlternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectAlternative(alt)}
                      className="w-full text-left p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-500 bg-zinc-50/50 hover:bg-amber-50/10 dark:bg-zinc-900 dark:hover:bg-zinc-800/40 transition"
                    >
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{cleanDishName(alt.title)}</h4>
                      {alt.reason && <p className="text-[10px] text-zinc-400 mt-1">{alt.reason}</p>}
                      <div className="flex justify-between text-[11px] font-semibold text-zinc-500 mt-2">
                        <span>🔥 {alt.calories} kcal</span>
                        <span>P: {alt.protein}g</span>
                        <span>C: {alt.carbs}g</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Daily Nutrition Targets */}
          {activePlan && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-5">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Daily Target Summary</h3>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Target: {user?.dailyCalorieTarget || 2000} kcal
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50/30 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100/50 dark:border-amber-900/40 text-center">
                  <span className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400 tracking-wider">Calories</span>
                  <p className="text-lg font-black text-amber-900 dark:text-amber-300 mt-0.5">{dailyCalories} kcal</p>
                  <span className="text-[9px] text-zinc-400 block mt-0.5">
                    {Math.round((dailyCalories / (user?.dailyCalorieTarget || 2000)) * 100)}% of goal
                  </span>
                </div>

                <div className="bg-green-50/30 p-3 rounded-2xl border border-green-100/50 text-center">
                  <span className="text-[10px] font-semibold uppercase text-green-700 tracking-wider">Protein</span>
                  <p className="text-lg font-black text-green-950 mt-0.5">{dailyProtein}g</p>
                </div>

                <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/50 text-center">
                  <span className="text-[10px] font-semibold uppercase text-indigo-700 tracking-wider">Carbs</span>
                  <p className="text-lg font-black text-indigo-950 mt-0.5">{dailyCarbs}g</p>
                </div>

                <div className="bg-yellow-50/30 p-3 rounded-2xl border border-yellow-100/50 text-center">
                  <span className="text-[10px] font-semibold uppercase text-yellow-700 tracking-wider">Fat</span>
                  <p className="text-lg font-black text-yellow-950 mt-0.5">{dailyFat}g</p>
                </div>
              </div>

              {/* Stacked macro percentage visual bar */}
              {dailyProtein + dailyCarbs + dailyFat > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Macro ratios</span>
                    <span>% by grams</span>
                  </div>
                  {(() => {
                    const total = dailyProtein + dailyCarbs + dailyFat;
                    const pPct = (dailyProtein / total) * 100;
                    const cPct = (dailyCarbs / total) * 100;
                    const fPct = (dailyFat / total) * 100;

                    return (
                      <div className="h-4.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full flex overflow-hidden">
                        <div style={{ width: `${pPct}%` }} className="bg-green-500" title="Protein" />
                        <div style={{ width: `${cPct}%` }} className="bg-indigo-500" title="Carbs" />
                        <div style={{ width: `${fPct}%` }} className="bg-yellow-500" title="Fat" />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Cooking Tips guide */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-3">
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-amber-500" /> Cooking & Prep Guide
            </h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              NutriVerse aligns meal suggestions to minimize kitchen waste. Swapping recipes automatically rebuilds your active grocery shopping catalog lists.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
