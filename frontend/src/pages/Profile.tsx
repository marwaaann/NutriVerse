import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "../utils/toast";
import {
  Scale,
  Activity,
  Heart,
  ShieldAlert,
  Edit3,
  Save,
  X,
  Flame,
  Globe,
  TrendingUp
} from "lucide-react";

type HeightUnit = "cm" | "ft/in";
type WeightUnit = "kg" | "lbs";
type BMICategory = "Underweight" | "Normal Weight" | "Overweight" | "Obese";

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

const ACTIVITY_OPTIONS = [
  { level: "Sedentary", label: "Sedentary (Little or no exercise)" },
  { level: "Lightly Active", label: "Lightly Active (1–3 days/week)" },
  { level: "Moderately Active", label: "Moderately Active (3–5 days/week)" },
  { level: "Very Active", label: "Very Active (6–7 days/week)" },
  { level: "Extremely Active", label: "Extremely Active (Physical job/training)" },
];

const GOAL_OPTIONS = [
  "Healthy Weight Gain",
  "Build Muscle Mass",
  "Increase Daily Calorie Intake Gradually",
  "Maintain Current Weight",
  "Lean Muscle Toning",
  "Improve Overall Nutrition Quality",
  "Athletic Performance / Stamina",
  "Gradual & Sustainable Weight Loss",
  "Fat Loss While Preserving Muscle",
  "Sustainable Long-Term Weight Management",
  "Improve Metabolic Health & Energy",
  "Gentle Calorie Deficit with High Satiety Foods"
];

export const Profile: React.FC = () => {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [fullname, setFullname] = useState("");
  const [age, setAge] = useState<number | string>("");
  const [gender, setGender] = useState<string>("Male");
  const [activityLevel, setActivityLevel] = useState<string>("Moderately Active");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [heightVal, setHeightVal] = useState<number | string>("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [weightVal, setWeightVal] = useState<number | string>("");
  const [healthGoal, setHealthGoal] = useState<string>("");
  const [dietaryPreference, setDietaryPreference] = useState<string>("Non-Vegetarian");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState<string>("");
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string>("");
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);

  // Sync user data to form state
  useEffect(() => {
    if (user) {
      setFullname(user.fullname || "");
      setAge(user.age || 25);
      setGender(user.gender || "Male");
      setActivityLevel(user.activityLevel || "Moderately Active");
      setHeightUnit(user.heightUnit || "cm");
      setHeightVal(user.height || 170);
      setWeightUnit(user.weightUnit || "kg");
      setWeightVal(user.weight || 68);
      setHealthGoal(user.healthGoal || "Maintain Current Weight");
      setDietaryPreference(user.dietaryPreference || "Non-Vegetarian");
      setAllergies(user.allergies || []);
      setPreferredCuisines(user.preferredCuisines?.length ? user.preferredCuisines : ["Indian"]);
      setDislikedFoods(user.foodPreferences?.join(", ") || "");
      setMealsPerDay(user.mealsPerDay || 3);
    }
  }, [user]);

  // Live BMI Recalculation for editing mode
  const liveBMI = useMemo(() => {
    const h = Number(heightVal);
    const w = Number(weightVal);
    if (!h || h <= 0 || !w || w <= 0) return null;

    const hM = heightUnit === "ft/in" ? h * 0.0254 : h / 100;
    const wKg = weightUnit === "lbs" ? w * 0.45359237 : w;
    if (hM <= 0) return null;

    return Math.round((wKg / (hM * hM)) * 10) / 10;
  }, [heightVal, heightUnit, weightVal, weightUnit]);

  const liveBMICategory: BMICategory = useMemo(() => {
    if (!liveBMI) return "Normal Weight";
    if (liveBMI < 18.5) return "Underweight";
    if (liveBMI < 25.0) return "Normal Weight";
    if (liveBMI < 30.0) return "Overweight";
    return "Obese";
  }, [liveBMI]);

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case "Underweight":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Normal Weight":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Overweight":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Obese":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
  };

  const toggleAllergy = (alg: string) => {
    setAllergies(prev =>
      prev.includes(alg) ? prev.filter(a => a !== alg) : [...prev, alg]
    );
  };

  const handleAddCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies(prev => [...prev, trimmed]);
      setCustomAllergy("");
    }
  };

  const toggleCuisine = (csn: string) => {
    setPreferredCuisines(prev =>
      prev.includes(csn)
        ? (prev.length > 1 ? prev.filter(c => c !== csn) : prev)
        : [...prev, csn]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullname.trim()) {
      showToast.error("Full name cannot be empty.");
      return;
    }

    const numAge = Number(age);
    if (!numAge || numAge < 10 || numAge > 120) {
      showToast.error("Please enter a realistic age between 10 and 120.");
      return;
    }

    const numHeight = Number(heightVal);
    if (!numHeight || numHeight <= 0) {
      showToast.error("Please enter a valid height.");
      return;
    }

    const numWeight = Number(weightVal);
    if (!numWeight || numWeight <= 0) {
      showToast.error("Please enter a valid weight.");
      return;
    }

    setIsSaving(true);
    try {
      const parsedDislikes = dislikedFoods
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        fullname: fullname.trim(),
        age: numAge,
        gender: gender as any,
        activityLevel: activityLevel as any,
        height: numHeight,
        heightUnit,
        weight: numWeight,
        weightUnit,
        healthGoal,
        dietaryPreference,
        allergies,
        foodPreferences: parsedDislikes,
        preferredCuisines,
        mealsPerDay,
      };

      await userService.updateProfile(payload);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      showToast.success("Profile updated successfully! BMI and calorie targets updated.");
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      showToast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner border border-white/30">
            {user?.fullname ? user.fullname.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {user?.fullname || "User Profile"}
              </h1>
              <span className="bg-white/20 backdrop-blur-md text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full tracking-wider">
                {user?.dietaryPreference || "Health Pro"}
              </span>
            </div>
            <p className="text-amber-100 text-xs sm:text-sm mt-0.5">{user?.email}</p>
            {user?.phone && (
              <p className="text-amber-200/80 text-xs mt-0.5">📞 {user.phone}</p>
            )}
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-5 py-2.5 rounded-2xl shadow-md transition flex items-center gap-2 text-sm cursor-pointer"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-black/30 hover:bg-black/40 text-white font-bold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <X className="h-4 w-4" /> Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="space-y-8">
          {/* Health & BMI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* BMI Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-amber-500" /> BMI Score
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(user?.bmiCategory)}`}>
                  {user?.bmiCategory || "Normal Weight"}
                </span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-white">
                {user?.bmi || 22.5}
              </div>
              <p className="text-[11px] text-zinc-400">
                Category: <strong>{user?.bmiCategory || "Normal Weight"}</strong>
              </p>
            </div>

            {/* Daily Calorie Target */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" /> Daily Target
                </span>
                <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Calculated
                </span>
              </div>
              <div className="text-3xl font-black text-zinc-900 dark:text-white">
                {user?.dailyCalorieTarget || 2000} <span className="text-sm font-semibold text-zinc-400">kcal</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Mifflin-St Jeor metabolic target
              </p>
            </div>

            {/* Height & Weight */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-500" /> Body Metrics
                </span>
              </div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white pt-1">
                {user?.height || 170} {user?.heightUnit || "cm"} &bull; {user?.weight || 68} {user?.weightUnit || "kg"}
              </div>
              <p className="text-[11px] text-zinc-400">
                Age: {user?.age || 25} yrs &bull; {user?.gender || "Not specified"}
              </p>
            </div>

            {/* Activity Level */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-500" /> Activity Level
                </span>
              </div>
              <div className="text-base font-extrabold text-zinc-900 dark:text-white pt-1">
                {user?.activityLevel || "Moderately Active"}
              </div>
              <p className="text-[11px] text-zinc-400">
                {user?.mealsPerDay || 3} meals scheduled per day
              </p>
            </div>
          </div>

          {/* Nutrition & Personal Preferences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health Goal & Nutrition Approach */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" /> Health Objective & Diet
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Health Goal</span>
                  <span className="font-bold text-zinc-900 dark:text-white text-right">
                    {user?.healthGoal || "Maintain Current Weight"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-400">Dietary Preference</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {user?.dietaryPreference || "Non-Vegetarian"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-500 dark:text-zinc-400">Meals Per Day</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {user?.mealsPerDay || 3} meals
                  </span>
                </div>
              </div>
            </div>

            {/* Allergies & Safety Filter */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" /> Allergies & Exclusions
              </h3>

              <div className="space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Ingredients strictly filtered out of your automated AI meal plans:
                </p>

                {user?.allergies && user.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.allergies.map(alg => (
                      <span
                        key={alg}
                        className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900"
                      >
                        ✕ {alg}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 italic">No allergens recorded.</div>
                )}

                {user?.foodPreferences && user.foodPreferences.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                      Disliked Ingredients:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.foodPreferences.map(dis => (
                        <span
                          key={dis}
                          className="px-2.5 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs"
                        >
                          {dis}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preferred Cuisines */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm space-y-4 md:col-span-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-500" /> Preferred Cuisines
              </h3>

              {user?.preferredCuisines && user.preferredCuisines.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.preferredCuisines.map(csn => (
                    <span
                      key={csn}
                      className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-900"
                    >
                      🍽️ {csn}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 italic">No specific cuisine preference selected.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* EDIT PROFILE MODE */
        <form onSubmit={handleSaveProfile} className="space-y-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-amber-500" /> Edit Health & Personal Profile
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Changes to height or weight will automatically recalculate your BMI and adjust daily caloric targets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Full Name</label>
              <input
                type="text"
                value={fullname}
                onChange={e => setFullname(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Age (years)</label>
              <input
                type="number"
                min="10"
                max="120"
                value={age}
                onChange={e => setAge(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Activity Level</label>
              <select
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              >
                {ACTIVITY_OPTIONS.map(a => (
                  <option key={a.level} value={a.level}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Height with Unit toggle */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Height</label>
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setHeightUnit("cm")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${heightUnit === "cm" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit("ft/in")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${heightUnit === "ft/in" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                  >
                    inches
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="50"
                max="300"
                value={heightVal}
                onChange={e => setHeightVal(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              />
            </div>

            {/* Weight with Unit toggle */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Weight</label>
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setWeightUnit("kg")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${weightUnit === "kg" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit("lbs")}
                    className={`px-2 py-0.5 rounded-md font-bold transition ${weightUnit === "lbs" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="20"
                max="500"
                value={weightVal}
                onChange={e => setWeightVal(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Live BMI recalculation badge */}
          {liveBMI && (
            <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Instant Recalculated BMI:
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-zinc-900 dark:text-white">{liveBMI}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(liveBMICategory)}`}>
                  {liveBMICategory}
                </span>
              </div>
            </div>
          )}

          {/* Health Goal */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Health Goal</label>
            <select
              value={healthGoal}
              onChange={e => setHealthGoal(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
            >
              {GOAL_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Dietary Preference */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Dietary Preference</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(diet => (
                <button
                  key={diet}
                  type="button"
                  onClick={() => setDietaryPreference(diet)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    dietaryPreference === diet
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Allergies (Strictly Excluded)</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGY_OPTIONS.map(alg => (
                <button
                  key={alg}
                  type="button"
                  onClick={() => toggleAllergy(alg)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    allergies.includes(alg)
                      ? "bg-red-500 text-white border-red-500 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {alg}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customAllergy}
                onChange={e => setCustomAllergy(e.target.value)}
                placeholder="Add custom allergy..."
                className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-amber-500 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCustomAllergy}
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preferred Cuisines */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Preferred Cuisines</label>
            <div className="flex flex-wrap gap-1.5">
              {CUISINE_OPTIONS.map(csn => (
                <button
                  key={csn}
                  type="button"
                  onClick={() => toggleCuisine(csn)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    preferredCuisines.includes(csn)
                      ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {csn}
                </button>
              ))}
            </div>
          </div>

          {/* Meals Per Day */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Meals Per Day</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMealsPerDay(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    mealsPerDay === num
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  {num} Meals
                </button>
              ))}
            </div>
          </div>

          {/* Disliked Ingredients */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Disliked Ingredients (Comma Separated)</label>
            <input
              type="text"
              value={dislikedFoods}
              onChange={e => setDislikedFoods(e.target.value)}
              placeholder="e.g. Bitter gourd, Cilantro, Capsicum"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
