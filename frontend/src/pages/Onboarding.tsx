import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "../utils/toast";
import {
  Scale,
  Activity,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  Info,
  TrendingUp,
  Target,
  Utensils
} from "lucide-react";

type HeightUnit = "cm" | "ft/in";
type WeightUnit = "kg" | "lbs";
type BMICategory = "Underweight" | "Normal Weight" | "Overweight" | "Obese";

interface GoalOptionSet {
  title: string;
  category: BMICategory;
  badgeColor: string;
  description: string;
  goals: { id: string; label: string; desc: string }[];
  paces?: { id: string; label: string; desc: string }[];
  focusAreas: { id: string; label: string; desc: string }[];
}

const CATEGORY_GOALS: Record<BMICategory, GoalOptionSet> = {
  Underweight: {
    title: "Nourish & Build",
    category: "Underweight",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Your BMI indicates you may benefit from gentle, nutrient-dense weight gain.",
    goals: [
      { id: "Healthy Weight Gain", label: "Healthy Weight Gain", desc: "Steady, nutritious caloric surplus to reach a healthy weight" },
      { id: "Build Muscle Mass", label: "Build Muscle Mass", desc: "Higher protein intake combined with wholesome energy foods" },
      { id: "Increase Daily Calorie Intake Gradually", label: "Gradual Calorie Increase", desc: "Gently expand daily caloric intake without feeling bloated" },
      { id: "Improve Energy and Nutrient Density", label: "Energy & Vitality", desc: "Prioritize micro-nutrients, healthy fats, and sustained stamina" },
    ],
    paces: [
      { id: "Slow & Steady (+0.25 to +0.5 kg / week)", label: "Slow & Steady", desc: "+0.25 to +0.5 kg / week (Gentle & Sustainable)" },
      { id: "Moderate (+0.5 kg / week)", label: "Moderate Pace", desc: "+0.5 kg / week (Recommended for healthy gains)" },
    ],
    focusAreas: [
      { id: "Nutrient-Dense Foods", label: "Nutrient-Dense Foods", desc: "Nuts, seeds, dairy, healthy oils, whole grains" },
      { id: "Extra Snacks", label: "Smart Snacking", desc: "Wholesome snacks between main meals" },
      { id: "High-Protein Focus", label: "High-Protein Focus", desc: "Lean meats, pulses, paneer, and eggs" },
    ],
  },
  "Normal Weight": {
    title: "Balance & Optimize",
    category: "Normal Weight",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "Great news! Your BMI falls within the healthy range. Let's focus on maintenance, toning, and optimal vitality.",
    goals: [
      { id: "Maintain Current Weight", label: "Maintain Current Weight", desc: "Sustain balanced energy in/energy out with whole foods" },
      { id: "Lean Muscle Toning", label: "Lean Muscle Toning", desc: "Tone physique with high-protein clean meals and low added sugars" },
      { id: "Improve Overall Nutrition Quality", label: "Nutritional Quality", desc: "Diversify vegetables, fiber, micronutrients, and hydration" },
      { id: "Athletic Performance / Stamina", label: "Athletic Performance", desc: "Fuel workouts and daily activity with optimal complex carbs" },
    ],
    focusAreas: [
      { id: "Balanced Macronutrients", label: "Balanced Macronutrients", desc: "Optimal 45% carbs, 30% protein, 25% healthy fats" },
      { id: "Mindful Eating & Consistency", label: "Mindful Eating", desc: "Consistent meal timings and intuitive portion control" },
      { id: "Fitness Fuel", label: "Fitness Fuel", desc: "Clean pre- and post-activity nourishment" },
    ],
  },
  Overweight: {
    title: "Sustainable Fat Loss",
    category: "Overweight",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    description: "Your BMI indicates an opportunity for healthy, steady fat loss with satisfying, nutrient-rich meals.",
    goals: [
      { id: "Gradual & Sustainable Weight Loss", label: "Gradual Weight Loss", desc: "Manageable caloric deficit with high satiety to prevent hunger" },
      { id: "Fat Loss While Preserving Muscle", label: "Fat Loss & Muscle Retention", desc: "High protein intake to keep lean tissue while burning fat" },
      { id: "Healthier Habit Building", label: "Healthier Habit Building", desc: "Replace ultra-processed foods with delicious home cooking" },
      { id: "Better Portion Control", label: "Better Portion Control", desc: "Volume eating with rich veggies and low-calorie density meals" },
    ],
    paces: [
      { id: "Sustainable (-0.25 to -0.5 kg / week)", label: "Sustainable Pace", desc: "-0.25 to -0.5 kg / week (Gentle & Lasting)" },
      { id: "Moderate (-0.5 to -0.75 kg / week)", label: "Moderate Pace", desc: "-0.5 to -0.75 kg / week (Safe and structured)" },
    ],
    focusAreas: [
      { id: "High Fiber & High Protein", label: "High Fiber & High Protein", desc: "Keeps you full for hours and prevents cravings" },
      { id: "Whole Foods, Reduced Refined Sugars", label: "Whole Foods Focus", desc: "Eliminate hidden sugars and processed junk naturally" },
      { id: "Smart Snacking Alternatives", label: "Smart Snacking", desc: "Crunchy greens, nuts, greek yogurt, roasted seeds" },
    ],
  },
  Obese: {
    title: "Health Restoration & Wellness",
    category: "Obese",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    description: "Your health journey starts with gentle, supportive nutrition designed for long-term vitality, never starvation.",
    goals: [
      { id: "Sustainable Long-Term Weight Management", label: "Long-Term Management", desc: "Non-restrictive approach focusing on metabolic wellness" },
      { id: "Improve Metabolic Health & Energy", label: "Metabolic Health & Energy", desc: "Stabilize blood sugars and boost all-day energy levels" },
      { id: "Gentle Calorie Deficit with High Satiety Foods", label: "Gentle Deficit & High Satiety", desc: "Eat hearty portions of fiber and protein without feeling deprived" },
      { id: "Habit-First Nutrition (Non-Restrictive)", label: "Habit-First Nutrition", desc: "Step-by-step sustainable lifestyle shifts that last a lifetime" },
    ],
    paces: [
      { id: "Safe, gradual progress (-0.5 kg / week recommended)", label: "Safe Recommended Pace", desc: "-0.5 kg / week (Physician-recommended safe range)" },
    ],
    focusAreas: [
      { id: "High Satiety Foods", label: "High Satiety Foods", desc: "Cruciferous veggies, legumes, lean protein, and seeds" },
      { id: "Regular Meal Timings", label: "Consistent Meal Timings", desc: "Establish stable meal patterns to prevent late-night binging" },
      { id: "Low Ultra-Processed Reliance", label: "Wholesome Home Cooking", desc: "Gradually swap packaged snacks with tasty real food" },
      { id: "Hydration & Balanced Portions", label: "Hydration & Balance", desc: "Abundant water and balanced plate proportions" },
    ],
  },
};

const CUISINE_OPTIONS = [
  "Indian", "South Indian", "North Indian", "Kerala", "Tamil",
  "Punjabi", "Andhra", "Mughlai", "Chinese", "Italian",
  "Mediterranean", "Mexican", "Arabian", "Continental"
];

const ALLERGY_OPTIONS = [
  "Peanuts", "Tree nuts", "Milk / Dairy", "Eggs", "Gluten",
  "Soy", "Shellfish", "Fish", "Sesame"
];

const DIETARY_OPTIONS = [
  "Non-Vegetarian", "Vegetarian", "Vegan", "Eggetarian", "Pescatarian"
];

export const Onboarding: React.FC = () => {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Step flow: 1=Basic Info, 2=Height & Weight, 3=BMI Result & Category, 4=Category-Exclusive Goals, 5=Diet & Cuisines
  const [step, setStep] = useState<number>(1);

  // Step 1: Basic info
  const [age, setAge] = useState<string>("25");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "Prefer not to say">("Male");
  const [activityLevel, setActivityLevel] = useState<"Sedentary" | "Lightly Active" | "Moderately Active" | "Very Active" | "Extremely Active">("Moderately Active");

  // Step 2: Height & Weight
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [heightCm, setHeightCm] = useState<string>("170");
  const [heightFt, setHeightFt] = useState<string>("5");
  const [heightIn, setHeightIn] = useState<string>("7");

  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weightVal, setWeightVal] = useState<string>("68");

  // Step 4: Category Exclusive Goals
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedPace, setSelectedPace] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  // Step 5: Dietary Preferences & Allergies
  const [dietaryPreference, setDietaryPreference] = useState<string>("Non-Vegetarian");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState<string>("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Indian", "South Indian"]);
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [dislikedFoods, setDislikedFoods] = useState<string>("");

  // Loading animation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // BMI Calculation
  const calculatedBMI = useMemo(() => {
    let hM = 0;
    if (heightUnit === "cm") {
      const cm = Number(heightCm);
      if (cm > 0) hM = cm / 100;
    } else {
      const ft = Number(heightFt) || 0;
      const inch = Number(heightIn) || 0;
      const totalInches = ft * 12 + inch;
      if (totalInches > 0) hM = totalInches * 0.0254;
    }

    let wKg = 0;
    const w = Number(weightVal);
    if (w > 0) {
      wKg = weightUnit === "lbs" ? w * 0.45359237 : w;
    }

    if (hM <= 0 || wKg <= 0) return null;
    const bmiVal = Math.round((wKg / (hM * hM)) * 10) / 10;
    return bmiVal;
  }, [heightUnit, heightCm, heightFt, heightIn, weightUnit, weightVal]);

  const bmiCategory: BMICategory = useMemo(() => {
    if (!calculatedBMI) return "Normal Weight";
    if (calculatedBMI < 18.5) return "Underweight";
    if (calculatedBMI < 25.0) return "Normal Weight";
    if (calculatedBMI < 30.0) return "Overweight";
    return "Obese";
  }, [calculatedBMI]);

  // Set default goal when BMI category is determined
  const activeCategoryGoals = CATEGORY_GOALS[bmiCategory];

  const handleNext = () => {
    if (step === 1) {
      const ageNum = Number(age);
      if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
        showToast.error("Please enter a realistic age between 10 and 120.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      // Validate height
      if (heightUnit === "cm") {
        const cm = Number(heightCm);
        if (!heightCm || isNaN(cm) || cm < 80 || cm > 250) {
          showToast.error("Please enter a realistic height between 80 cm and 250 cm.");
          return;
        }
      } else {
        const ft = Number(heightFt);
        const inch = Number(heightIn);
        if (isNaN(ft) || ft < 2 || ft > 8 || isNaN(inch) || inch < 0 || inch >= 12) {
          showToast.error("Please enter a realistic height (e.g. 5 ft 8 in).");
          return;
        }
      }

      // Validate weight
      const w = Number(weightVal);
      if (weightUnit === "kg") {
        if (!weightVal || isNaN(w) || w < 25 || w > 300) {
          showToast.error("Please enter a realistic weight between 25 kg and 300 kg.");
          return;
        }
      } else {
        if (!weightVal || isNaN(w) || w < 55 || w > 660) {
          showToast.error("Please enter a realistic weight between 55 lbs and 660 lbs.");
          return;
        }
      }

      // Pre-select first goal for this category if none selected
      if (!selectedGoal) {
        setSelectedGoal(activeCategoryGoals.goals[0].id);
      }
      if (activeCategoryGoals.paces && !selectedPace) {
        setSelectedPace(activeCategoryGoals.paces[0].id);
      }

      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!selectedGoal) {
        showToast.error("Please select a primary health goal to proceed.");
        return;
      }
      setStep(5);
      return;
    }

    if (step === 5) {
      if (selectedCuisines.length === 0) {
        showToast.error("Please select at least one preferred cuisine.");
        return;
      }
      handleFinishOnboarding();
      return;
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const handleAddCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !selectedAllergies.includes(trimmed)) {
      setSelectedAllergies(prev => [...prev, trimmed]);
      setCustomAllergy("");
    }
  };

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine)
        ? (prev.length > 1 ? prev.filter(c => c !== cuisine) : prev)
        : [...prev, cuisine]
    );
  };

  const toggleFocusArea = (focusId: string) => {
    setSelectedFocus(prev =>
      prev.includes(focusId) ? prev.filter(f => f !== focusId) : [...prev, focusId]
    );
  };

  const handleFinishOnboarding = async () => {
    setIsGenerating(true);
    setGenerationStep(0);

    const stages = [
      "Analyzing body composition and metabolic baseline...",
      "Calculating safe caloric thresholds & macro targets...",
      "Excluding allergens and tailoring goal requirements...",
      "Generating your personalized today meal plan...",
      "Generating tomorrow's nutritious meal schedule...",
      "Finalizing your customized NutriVerse dashboard..."
    ];

    const timer = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1200);

    try {
      // Calculate numeric height for payload
      let finalHeight = Number(heightCm);
      if (heightUnit === "ft/in") {
        const ft = Number(heightFt) || 0;
        const inch = Number(heightIn) || 0;
        finalHeight = ft * 12 + inch; // Backend treats this as total inches if heightUnit is "ft/in"
      }

      const finalWeight = Number(weightVal);
      const parsedDislikes = dislikedFoods
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        height: finalHeight,
        heightUnit,
        weight: finalWeight,
        weightUnit,
        age: Number(age),
        gender,
        activityLevel,
        healthGoal: selectedGoal,
        dietaryPreference,
        allergies: selectedAllergies,
        foodPreferences: parsedDislikes,
        preferredCuisines: selectedCuisines,
        mealsPerDay,
      };

      await userService.completeOnboarding(payload);

      // Invalidate queries so that currentUser has updated health profile & onboardingCompleted: true
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      clearInterval(timer);
      showToast.success("Personalized meal plan ready! Welcome to NutriVerse.");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      clearInterval(timer);
      showToast.error(err?.response?.data?.message || "Failed to initialize health plan.");
      setIsGenerating(false);
    }
  };

  // Generation loading screen
  if (isGenerating) {
    const stages = [
      "Analyzing body composition and metabolic baseline...",
      "Calculating safe caloric thresholds & macro targets...",
      "Excluding allergens and tailoring goal requirements...",
      "Generating your personalized today meal plan...",
      "Generating tomorrow's nutritious meal schedule...",
      "Finalizing your customized NutriVerse dashboard..."
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-amber-100 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-amber-900/10">
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
            <Sparkles className="h-10 w-10 text-amber-500 animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-zinc-900 mb-2">
            Building Your NutriVerse Plan
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            Personalizing meals strictly aligned to your BMI, goals, and allergies.
          </p>

          <div className="space-y-3 text-left">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {idx < generationStep ? (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                    ✓
                  </span>
                ) : idx === generationStep ? (
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center font-semibold flex-shrink-0">
                    {idx + 1}
                  </span>
                )}
                <span className={idx === generationStep ? "font-bold text-zinc-800" : idx < generationStep ? "text-zinc-500" : "text-zinc-400"}>
                  {stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/30 flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      {/* Header Branding */}
      <div className="w-full max-w-xl mb-6 text-center">
        <div className="inline-flex items-center gap-2 mb-2 bg-amber-100/80 px-3 py-1 rounded-full text-xs font-bold text-amber-800">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          NutriVerse Personalized Health Onboarding
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Welcome{user?.fullname ? `, ${user.fullname.split(" ")[0]}` : ""}! Let's Calibrate Your Nutrition
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          Step {step} of 5 &bull; {step === 1 ? "Basic Profile" : step === 2 ? "Body Measurements" : step === 3 ? "Your BMI Insight" : step === 4 ? "Goal Calibration" : "Dietary Habits"}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 h-2 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-950/5">

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" /> Basic Information
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Tell us about your age, gender, and daily lifestyle.
              </p>
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Age (years)</label>
              <input
                type="number"
                min="10"
                max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Gender</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["Male", "Female", "Other", "Prefer not to say"] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      gender === g
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Activity Level</label>
              <div className="space-y-2">
                {[
                  { level: "Sedentary", title: "Sedentary", desc: "Little or no exercise, desk job" },
                  { level: "Lightly Active", title: "Lightly Active", desc: "Light exercise 1–3 days per week" },
                  { level: "Moderately Active", title: "Moderately Active", desc: "Moderate exercise 3–5 days per week" },
                  { level: "Very Active", title: "Very Active", desc: "Hard exercise or sports 6–7 days per week" },
                  { level: "Extremely Active", title: "Extremely Active", desc: "Physical job or intense training twice daily" },
                ].map(act => (
                  <button
                    key={act.level}
                    type="button"
                    onClick={() => setActivityLevel(act.level as any)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      activityLevel === act.level
                        ? "bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500"
                        : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs">{act.title}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{act.desc}</p>
                    </div>
                    {activityLevel === act.level && (
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Height & Weight */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <Scale className="h-5 w-5 text-amber-500" /> Height & Weight
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Used to determine your Basal Metabolic Rate and safe calorie range.
              </p>
            </div>

            {/* Height Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-700">Height</label>
                <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setHeightUnit("cm")}
                    className={`px-3 py-1 rounded-md transition ${heightUnit === "cm" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit("ft/in")}
                    className={`px-3 py-1 rounded-md transition ${heightUnit === "ft/in" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                  >
                    ft / in
                  </button>
                </div>
              </div>

              {heightUnit === "cm" ? (
                <div className="relative">
                  <input
                    type="number"
                    min="80"
                    max="250"
                    value={heightCm}
                    onChange={e => setHeightCm(e.target.value)}
                    placeholder="170"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                  />
                  <span className="absolute right-4 top-3 text-xs font-semibold text-zinc-400">cm</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={heightFt}
                      onChange={e => setHeightFt(e.target.value)}
                      placeholder="5"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    />
                    <span className="absolute right-4 top-3 text-xs font-semibold text-zinc-400">ft</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="11"
                      value={heightIn}
                      onChange={e => setHeightIn(e.target.value)}
                      placeholder="7"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                    />
                    <span className="absolute right-4 top-3 text-xs font-semibold text-zinc-400">in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weight Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-zinc-700">Weight</label>
                <div className="inline-flex bg-zinc-100 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setWeightUnit("kg")}
                    className={`px-3 py-1 rounded-md transition ${weightUnit === "kg" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit("lbs")}
                    className={`px-3 py-1 rounded-md transition ${weightUnit === "lbs" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                  >
                    lbs
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min={weightUnit === "kg" ? 25 : 55}
                  max={weightUnit === "kg" ? 300 : 660}
                  value={weightVal}
                  onChange={e => setWeightVal(e.target.value)}
                  placeholder={weightUnit === "kg" ? "68" : "150"}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
                />
                <span className="absolute right-4 top-3 text-xs font-semibold text-zinc-400">{weightUnit}</span>
              </div>
            </div>

            {/* Live BMI Preview Pill */}
            {calculatedBMI && (
              <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-zinc-700">Live Estimated BMI:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-zinc-900">{calculatedBMI}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_GOALS[bmiCategory].badgeColor}`}>
                    {bmiCategory}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Automatic BMI Calculation & Classification */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600">
              <Scale className="h-8 w-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Calculated Body Mass Index</span>
              <div className="text-5xl font-black text-zinc-900 mt-1">
                {calculatedBMI || "22.4"}
              </div>
              <div className="mt-2">
                <span className={`inline-block text-xs font-black px-4 py-1 rounded-full border shadow-sm ${activeCategoryGoals.badgeColor}`}>
                  {bmiCategory}
                </span>
              </div>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto mt-3 font-medium">
                {activeCategoryGoals.description}
              </p>
            </div>

            {/* Visual 4-Zone Scale */}
            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl text-left space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>

              {/* Bar */}
              <div className="h-3 w-full rounded-full flex overflow-hidden">
                <div className="w-1/4 bg-blue-400" title="Underweight (< 18.5)"></div>
                <div className="w-1/4 bg-emerald-400" title="Normal (18.5 - 24.9)"></div>
                <div className="w-1/4 bg-amber-400" title="Overweight (25.0 - 29.9)"></div>
                <div className="w-1/4 bg-rose-400" title="Obese (≥ 30.0)"></div>
              </div>

              <div className="flex justify-between text-[9px] text-zinc-400 font-semibold">
                <span>&lt; 18.5</span>
                <span>18.5 - 24.9</span>
                <span>25.0 - 29.9</span>
                <span>30.0+</span>
              </div>
            </div>

            {/* Supportive Wellness Note */}
            <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-left">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                <strong>General Wellness Note:</strong> BMI is a helpful screening metric for broad population data, not a medical diagnosis. NutriVerse uses your BMI to establish safe, non-extreme caloric thresholds and nutrient targets.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Category-Exclusive Goal Questions */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" /> Choose Your Goal
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeCategoryGoals.badgeColor}`}>
                  {bmiCategory} Track
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Showing tailored recommendations exclusively for your body metrics.
              </p>
            </div>

            {/* Primary Goal Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Primary Objective</label>
              <div className="space-y-2">
                {activeCategoryGoals.goals.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      selectedGoal === g.id
                        ? "bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500"
                        : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs">{g.label}</h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{g.desc}</p>
                    </div>
                    {selectedGoal === g.id && (
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Pace (if applicable for category) */}
            {activeCategoryGoals.paces && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Preferred Pace</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeCategoryGoals.paces.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPace(p.id)}
                      className={`text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                        selectedPace === p.id
                          ? "bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500"
                          : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700"
                      }`}
                    >
                      <span className="font-bold block">{p.label}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nutritional Focus Areas */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Nutritional Emphasis (Optional)</label>
              <div className="space-y-2">
                {activeCategoryGoals.focusAreas.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFocusArea(f.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${
                      selectedFocus.includes(f.id)
                        ? "bg-amber-500/10 border-amber-500 text-amber-950"
                        : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700"
                    }`}
                  >
                    <div>
                      <span className="font-bold">{f.label}</span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{f.desc}</span>
                    </div>
                    {selectedFocus.includes(f.id) && (
                      <Check className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Additional Personalization Questions */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                <Utensils className="h-5 w-5 text-amber-500" /> Food Preferences & Allergies
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Customize dietary rules so AI only suggests meals you love and can safely enjoy.
              </p>
            </div>

            {/* Dietary Preference */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Dietary Pattern</label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(diet => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => setDietaryPreference(diet)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      dietaryPreference === diet
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span>Allergies (Strictly Excluded)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_OPTIONS.map(alg => (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => toggleAllergy(alg)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                      selectedAllergies.includes(alg)
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {alg}
                  </button>
                ))}
              </div>

              {/* Custom Allergy */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customAllergy}
                  onChange={e => setCustomAllergy(e.target.value)}
                  placeholder="Add custom allergy (e.g. Mushrooms)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAllergy}
                  className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Preferred Cuisines */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Preferred Cuisines</label>
              <div className="flex flex-wrap gap-1.5">
                {CUISINE_OPTIONS.map(csn => (
                  <button
                    key={csn}
                    type="button"
                    onClick={() => toggleCuisine(csn)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      selectedCuisines.includes(csn)
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {csn}
                  </button>
                ))}
              </div>
            </div>

            {/* Meals Per Day */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Meals Per Day</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMealsPerDay(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      mealsPerDay === num
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {num} Meals
                  </button>
                ))}
              </div>
            </div>

            {/* Disliked Foods / Ingredients */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Disliked Ingredients (Comma Separated)</label>
              <input
                type="text"
                value={dislikedFoods}
                onChange={e => setDislikedFoods(e.target.value)}
                placeholder="e.g. Bitter gourd, Cilantro, Capsicum"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            {step === 5 ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" /> Generate Meal Plan
              </>
            ) : (
              <>
                Continue <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
