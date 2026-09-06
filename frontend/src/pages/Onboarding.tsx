import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import axiosInstance from "../api/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "../utils/toast";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Heart, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Check
} from "lucide-react";

interface MemberInput {
  name: string;
  ageGroup: string;
  relationship: string;
  dietaryPreference: string;
  allergies: string[];
  dislikedFoods: string[];
  preferredFoods: string[];
  cuisines: string[];
  spiceLevel: string;
}

const CUISINE_OPTIONS = [
  "Indian", "South Indian", "North Indian", "Kerala", "Tamil", 
  "Punjabi", "Andhra", "Mughlai", "Chinese", "Italian", 
  "Mexican", "Mediterranean", "Arabian", "Continental"
];

const ALLERGY_OPTIONS = [
  "Peanuts", "Tree nuts", "Milk / Dairy", "Eggs", "Gluten", 
  "Soy", "Shellfish", "Fish", "Sesame"
];

export const Onboarding: React.FC = () => {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [fullname, setFullname] = useState(user?.fullname || "");
  const [householdType, setHouseholdType] = useState<"single" | "household">("single");
  
  // Household members list
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAge, setNewMemberAge] = useState("Adult");
  const [newMemberRelation, setNewMemberRelation] = useState("Family");
  const [newMemberDiet, setNewMemberDiet] = useState("Non-vegetarian");
  const [newMemberAllergies, setNewMemberAllergies] = useState<string[]>([]);
  const [newMemberCuisines, setNewMemberCuisines] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");

  // Primary Preferences
  const [selectedDiet, setSelectedDiet] = useState("Non-vegetarian");
  const [selectedNonVeg, setSelectedNonVeg] = useState<string[]>(["Chicken", "Eggs"]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Indian"]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [dietaryRestrictions] = useState<string[]>([]);
  const [healthGoals, setHealthGoals] = useState<string[]>(["Balanced eating"]);
  const [cookingTime, setCookingTime] = useState("30 minute meals");
  const [spiceLevel, setSpiceLevel] = useState("Medium");
  const [mealTypes, setMealTypes] = useState<string[]>(["breakfast", "lunch", "dinner", "snack"]);
  const [cookingRoutine, setCookingRoutine] = useState("Cook fresh each meal");
  const [cookingExperience, setCookingExperience] = useState("Intermediate");

  // Generation status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  const totalSteps = 7;

  const handleNext = () => {
    if (step === 1) {
      if (!fullname.trim()) {
        showToast.error("Please enter your name");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      showToast.error("Member name is required");
      return;
    }
    const newMember: MemberInput = {
      name: newMemberName,
      ageGroup: newMemberAge,
      relationship: newMemberRelation,
      dietaryPreference: newMemberDiet,
      allergies: newMemberAllergies,
      dislikedFoods: [],
      preferredFoods: [],
      cuisines: newMemberCuisines,
      spiceLevel: "Medium"
    };
    setMembers([...members, newMember]);
    setNewMemberName("");
    setNewMemberAllergies([]);
    setNewMemberCuisines([]);
    showToast.success(`${newMemberName} added to household!`);
  };

  const handleRemoveMember = (idx: number) => {
    setMembers(members.filter((_, i) => i !== idx));
  };

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine]);
    }
  };

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      setSelectedAllergies(selectedAllergies.filter(a => a !== allergy));
    } else {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies([...selectedAllergies, customAllergy.trim()]);
      setCustomAllergy("");
    }
  };

  const toggleGoal = (goal: string) => {
    if (healthGoals.includes(goal)) {
      setHealthGoals(healthGoals.filter(g => g !== goal));
    } else {
      setHealthGoals([...healthGoals, goal]);
    }
  };

  const toggleNonVeg = (item: string) => {
    if (selectedNonVeg.includes(item)) {
      setSelectedNonVeg(selectedNonVeg.filter(i => i !== item));
    } else {
      setSelectedNonVeg([...selectedNonVeg, item]);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsGenerating(true);
    setGenerationStep(0);

    const stages = [
      "Analyzing household preferences...",
      "Excluding allergical ingredients...",
      "Structuring daily nutrient targets...",
      "Generating meal plan for today...",
      "Generating meal plan for tomorrow...",
      "Finalizing customized recipes list..."
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
      // 1. Update fullname
      if (fullname !== user?.fullname) {
        await userService.updateProfile(fullname);
      }

      // 2. Save household members
      if (householdType === "household") {
        for (const m of members) {
          await userService.addHouseholdMember(m);
        }
      }

      // 3. Save User Preferences
      let finalCookingTime = cookingTime;
      if (householdType === "single") {
        if (cookingRoutine === "Quick & simple (<20 mins)") {
          finalCookingTime = "Under 20 minutes";
        } else if (cookingRoutine === "Batch cooking & meal prep") {
          finalCookingTime = "Meal prep";
        }
      }

      await userService.savePreferences({
        cuisines: selectedCuisines,
        diet: selectedDiet,
        nonVegPreference: selectedDiet === "Non-vegetarian" ? selectedNonVeg : [],
        allergies: selectedAllergies,
        dietaryRestrictions,
        healthGoals,
        cookingTime: finalCookingTime,
        spiceLevel,
        mealTypes,
      });

      // 4. Generate first plans (Today, Tomorrow, Day after)
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const dayAfter = new Date(Date.now() + 172800000).toISOString().split("T")[0];

      await axiosInstance.post("/api/mealplanner/plan/generate", { date: today, silent: true });
      await axiosInstance.post("/api/mealplanner/plan/generate", { date: tomorrow, silent: true });
      await axiosInstance.post("/api/mealplanner/plan/generate", { date: dayAfter, silent: true });

      // Invalidate the auth query so that onboardingCompleted: true takes effect
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      
      clearInterval(timer);
      showToast.success("Meal plans initialized successfully!");
      navigate("/");
    } catch (error) {
      console.error(error);
      clearInterval(timer);
      showToast.error("Failed to complete personalization step.");
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    const stages = [
      "Analyzing household preferences...",
      "Excluding allergical ingredients...",
      "Structuring daily nutrient targets...",
      "Generating meal plan for today...",
      "Generating meal plan for tomorrow...",
      "Finalizing customized recipes list..."
    ];

    return (
      <div className="min-h-screen bg-amber-50/40 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-amber-100 rounded-3xl p-8 max-w-md w-full shadow-xl shadow-amber-900/5">
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-amber-100 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
            <Sparkles className="h-10 w-10 text-amber-500 animate-bounce" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Personalizing Your NutriVerse
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            We are configuring custom parameters matching your preferences.
          </p>

          <div className="space-y-3 text-left">
            {stages.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  generationStep > idx 
                    ? "bg-green-500 text-white" 
                    : generationStep === idx 
                      ? "bg-amber-500 text-white animate-pulse" 
                      : "bg-zinc-100 text-zinc-400"
                }`}>
                  {generationStep > idx ? "✓" : idx + 1}
                </div>
                <span className={`text-sm ${
                  generationStep === idx 
                    ? "text-zinc-900 font-semibold" 
                    : "text-zinc-400"
                }`}>
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
    <div className="min-h-screen bg-amber-50/40 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-amber-100/80 p-6 sm:p-8 rounded-3xl max-w-2xl w-full shadow-xl shadow-amber-900/5 transition-all">
        
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-amber-800 font-semibold mb-2 uppercase tracking-wider">
            <span>Onboarding Progress</span>
            <span>Step {step} of {totalSteps}</span>
          </div>
          <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
            <div 
              style={{ width: `${(step / totalSteps) * 100}%` }}
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Step 1: Welcome & Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-3xl">👋</span>
              <h2 className="text-2xl font-bold text-zinc-900 mt-2">Welcome to NutriVerse!</h2>
              <p className="text-sm text-zinc-500 mt-1">Let's build a customized diet roadmap matching your goals.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">What should we call you?</label>
              <input 
                type="text" 
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none focus:border-amber-500 focus:bg-white transition text-zinc-900"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Who usually eats with you?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setHouseholdType("single")}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                    householdType === "single"
                      ? "border-amber-500 bg-amber-50/50 text-amber-900 font-semibold ring-1 ring-amber-500"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <Users className="h-6 w-6" /> Just Me
                </button>
                <button
                  type="button"
                  onClick={() => setHouseholdType("household")}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
                    householdType === "household"
                      ? "border-amber-500 bg-amber-50/50 text-amber-900 font-semibold ring-1 ring-amber-500"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <UserPlus className="h-6 w-6" /> Family / Household
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Single Routine & Experience OR Household Setup */}
        {step === 2 && (
          <div className="space-y-6">
            {householdType === "single" ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Cooking Routine & Experience</h2>
                  <p className="text-sm text-zinc-500">Help us personalize recipes and prep speeds to your lifestyle.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-700">How do you prefer to plan and prepare meals?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { title: "Cook fresh each meal", desc: "Fresh hot meals prepared daily" },
                      { title: "Batch cooking & meal prep", desc: "Cook ahead and save time during the week" },
                      { title: "Quick & simple (<20 mins)", desc: "Fast weeknight convenience meals" },
                      { title: "Flexible mix", desc: "Balanced mix of home cooking & dining out" },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setCookingRoutine(item.title)}
                        className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                          cookingRoutine === item.title
                            ? "border-amber-500 bg-amber-50/50 text-amber-900 font-semibold ring-1 ring-amber-500"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <div className="font-semibold text-sm">{item.title}</div>
                        <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-zinc-700">What's your cooking experience level?</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { level: "Beginner", desc: "Simple, easy recipes" },
                      { level: "Intermediate", desc: "Everyday home cook" },
                      { level: "Advanced", desc: "Culinary explorer" },
                    ].map((item) => (
                      <button
                        key={item.level}
                        type="button"
                        onClick={() => setCookingExperience(item.level)}
                        className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                          cookingExperience === item.level
                            ? "border-amber-500 bg-amber-50/50 text-amber-900 font-semibold ring-1 ring-amber-500"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                        }`}
                      >
                        <div className="font-semibold text-sm">{item.level}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">Household Setup</h2>
                  <p className="text-sm text-zinc-500">Configure members who will share meals with you.</p>
                </div>

                {/* Quick add sub-form */}
                <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Add Household Member</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Member Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm outline-none text-zinc-900 focus:border-amber-500"
                    />
                    <select
                      value={newMemberAge}
                      onChange={(e) => setNewMemberAge(e.target.value)}
                      className="bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm outline-none text-zinc-900 focus:border-amber-500"
                    >
                      <option value="Adult">Adult</option>
                      <option value="Child">Child</option>
                      <option value="Toddler">Toddler</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newMemberRelation}
                      onChange={(e) => setNewMemberRelation(e.target.value)}
                      className="bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm outline-none text-zinc-900 focus:border-amber-500"
                    >
                      <option value="Partner">Partner</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Roommate">Roommate</option>
                    </select>

                    <select
                      value={newMemberDiet}
                      onChange={(e) => setNewMemberDiet(e.target.value)}
                      className="bg-white border border-zinc-200 px-3 py-2 rounded-xl text-sm outline-none text-zinc-900 focus:border-amber-500"
                    >
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-vegetarian">Non-vegetarian</option>
                      <option value="Vegan">Vegan</option>
                      <option value="Eggitarian">Eggitarian</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-xl text-sm shadow-sm transition cursor-pointer"
                  >
                    Add Member
                  </button>
                </div>

                {/* List of members added */}
                {members.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Household List</h4>
                    <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden bg-white">
                      {members.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 hover:bg-zinc-50/50 transition">
                          <div>
                            <p className="font-semibold text-zinc-900">{m.name}</p>
                            <p className="text-xs text-zinc-500">{m.relationship} • {m.ageGroup} • {m.dietaryPreference}</p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveMember(idx)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Diet & Cuisine preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Diet & Cuisines</h2>
              <p className="text-sm text-zinc-500">Specify your food preferences.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Diet Type</label>
              <div className="grid grid-cols-3 gap-3">
                {["Vegetarian", "Non-vegetarian", "Vegan", "Eggitarian", "Jain"].map(diet => (
                  <button
                    key={diet}
                    type="button"
                    onClick={() => setSelectedDiet(diet)}
                    className={`p-3 rounded-xl border text-sm transition font-semibold cursor-pointer ${
                      selectedDiet === diet
                        ? "border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {selectedDiet === "Non-vegetarian" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Preferred Proteins</label>
                <div className="flex flex-wrap gap-2">
                  {["Chicken", "Mutton", "Fish", "Eggs", "Seafood"].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleNonVeg(item)}
                      className={`px-4 py-2 rounded-full border text-xs transition font-semibold cursor-pointer ${
                        selectedNonVeg.includes(item)
                          ? "border-amber-500 bg-amber-500 text-white"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Favorite Cuisines</label>
              <div className="grid grid-cols-3 gap-2">
                {CUISINE_OPTIONS.map(cuisine => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisine(cuisine)}
                    className={`p-3 rounded-xl border text-xs transition font-semibold cursor-pointer ${
                      selectedCuisines.includes(cuisine)
                        ? "border-amber-500 bg-amber-50/50 text-amber-900 border-2 ring-1 ring-amber-500"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Allergies */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-amber-600 animate-pulse" /> Safety Allergies
              </h2>
              <p className="text-sm text-zinc-500">Excluded ingredients will never be suggested in meal plans or grocery lists.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ALLERGY_OPTIONS.map(allergy => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`p-3 rounded-xl border text-xs transition font-semibold flex items-center justify-between cursor-pointer ${
                    selectedAllergies.includes(allergy)
                      ? "border-red-500 bg-red-50/50 text-red-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <span>{allergy}</span>
                  {selectedAllergies.includes(allergy) && <Check className="h-3 w-3 text-red-500" />}
                </button>
              ))}
            </div>

            {/* Custom Allergy text field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Custom Allergy</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Garlic, Coriander"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded-xl outline-none focus:border-amber-500 focus:bg-white text-zinc-900 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAllergy}
                  className="px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Dietary/Health goals */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                <Heart className="h-6 w-6 text-amber-500" /> Health & Diet Goals
              </h2>
              <p className="text-sm text-zinc-500">Optional filters to guide meal macro ratios (Skip if you want).</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                "Balanced eating", "High protein", "Weight management", 
                "Muscle building", "Lower calorie", "More vegetables", 
                "High fibre", "Low sugar", "Heart-friendly"
              ].map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`p-4 rounded-xl border text-sm transition font-semibold text-left flex justify-between items-center cursor-pointer ${
                    healthGoals.includes(goal)
                      ? "border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <span>{goal}</span>
                  {healthGoals.includes(goal) && <Check className="h-4 w-4 text-amber-600" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Cooking Preferences */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Cooking Preferences</h2>
              <p className="text-sm text-zinc-500">Configure cooking speeds and daily frequencies.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Average prep speed</label>
              <div className="grid grid-cols-3 gap-2">
                {["Under 20 minutes", "30 minute meals", "Weekend cooking", "Meal prep"].map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setCookingTime(time)}
                    className={`p-3 rounded-xl border text-xs transition font-semibold cursor-pointer ${
                      cookingTime === time
                        ? "border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Spice Preference</label>
              <div className="grid grid-cols-3 gap-2">
                {["Mild", "Medium", "Spicy"].map(spice => (
                  <button
                    key={spice}
                    type="button"
                    onClick={() => setSpiceLevel(spice)}
                    className={`p-3 rounded-xl border text-sm transition font-semibold cursor-pointer ${
                      spiceLevel === spice
                        ? "border-amber-500 bg-amber-50/50 text-amber-900 ring-1 ring-amber-500"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {spice}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Frequencies</label>
              <div className="flex flex-wrap gap-2">
                {["breakfast", "lunch", "snack", "dinner"].map(meal => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => {
                      if (mealTypes.includes(meal)) {
                        setMealTypes(mealTypes.filter(m => m !== meal));
                      } else {
                        setMealTypes([...mealTypes, meal]);
                      }
                    }}
                    className={`px-4 py-2 rounded-full border text-xs uppercase tracking-wider transition font-semibold cursor-pointer ${
                      mealTypes.includes(meal)
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Final setup confirmation */}
        {step === 7 && (
          <div className="space-y-6 text-center py-6">
            <span className="text-5xl">🎉</span>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 mt-4">You're all set, {fullname}!</h2>
              <p className="text-sm text-zinc-500 mt-2">
                NutriVerse AI is ready to generate your first personalized daily meal targets and shopping catalog.
              </p>
            </div>

            <button
              onClick={handleFinishOnboarding}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-2xl shadow-md transition-all duration-200 inline-flex items-center gap-2 cursor-pointer w-full justify-center"
            >
              <Sparkles className="h-5 w-5 animate-pulse" /> Generate My Meal Plan
            </button>
          </div>
        )}

        {/* Navigation Actions */}
        {step < 7 && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-100">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="h-4.5 w-4.5" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
            >
              Continue <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
