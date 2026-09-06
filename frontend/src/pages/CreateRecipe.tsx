import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { recipeService } from "../services/recipeService";
import type { IngredientInput } from "../services/recipeService";
import { ArrowLeft, Plus, Trash2, Sparkles, Loader2, CheckCircle2 } from "lucide-react";

export const CreateRecipe: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [servings, setServings] = useState<number>(2);
  const [category, setCategory] = useState("Dinner");
  const [image, setImage] = useState("");

  const [ingredients, setIngredients] = useState<IngredientInput[]>([
    { name: "", quantity: 1, unit: "piece" },
  ]);
  const [preparationSteps, setPreparationSteps] = useState<string[]>([""]);

  // Multi-step loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"idle" | "analyzing" | "calculating" | "success">("idle");

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: 1, unit: "piece" }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, field: keyof IngredientInput, value: any) => {
    const updated = [...ingredients];
    if (field === "quantity") {
      updated[idx][field] = Number(value) || 0;
    } else {
      updated[idx][field] = value;
    }
    setIngredients(updated);
  };

  const handleAddStep = () => {
    setPreparationSteps([...preparationSteps, ""]);
  };

  const handleRemoveStep = (idx: number) => {
    setPreparationSteps(preparationSteps.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx: number, value: string) => {
    const updated = [...preparationSteps];
    updated[idx] = value;
    setPreparationSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Recipe title is required");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim() !== "");
    if (validIngredients.length === 0) {
      alert("At least one ingredient is required");
      return;
    }

    const validSteps = preparationSteps.filter((step) => step.trim() !== "");
    if (validSteps.length === 0) {
      alert("At least one preparation step is required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Step 1: Analyzing ingredients
      setLoadingStep("analyzing");
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate AI reading step

      // Step 2: Calculating nutrition
      setLoadingStep("calculating");
      
      const payload = {
        title,
        description,
        ingredients: validIngredients,
        preparationSteps: validSteps,
        cookingTime,
        servings,
        category,
        image: image || undefined,
      };

      const newRecipe = await recipeService.createRecipe(payload);
      
      // Step 3: Success state
      setLoadingStep("success");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      navigate(`/recipes/${newRecipe._id}`);
    } catch (err) {
      console.error("Failed to create recipe:", err);
      alert("An error occurred while creating the recipe. Please try again.");
      setLoadingStep("idle");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link
        to="/recipes"
        className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 font-semibold mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Recipes
      </Link>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-6">Create New Recipe</h1>

        {isSubmitting ? (
          /* Multi-step loading layout */
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            {loadingStep === "analyzing" && (
              <>
                <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Analyzing ingredients...</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Gemini AI is parsing and normalizing quantities and units.</p>
              </>
            )}
            {loadingStep === "calculating" && (
              <>
                <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Calculating nutrition...</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Querying USDA FoodData Central and summing up macronutrients.</p>
              </>
            )}
            {loadingStep === "success" && (
              <>
                <CheckCircle2 className="h-16 w-16 text-green-500 animate-bounce" />
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Nutrition calculated successfully!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Saving recipe details and redirecting...</p>
              </>
            )}
          </div>
        ) : (
          /* Form Layout */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Recipe Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Garlic Butter Chicken Breast"
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide a brief description of the recipe..."
                  rows={3}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Cooking Time (minutes)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={cookingTime}
                  onChange={(e) => setCookingTime(Number(e.target.value))}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Servings</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Salad">Salad</option>
                  <option value="Snack">Snack</option>
                  <option value="Dessert">Dessert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://example.com/recipe.jpg"
                  className="w-full border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Ingredients Field list */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-zinc-900 dark:text-white text-lg">Ingredients</h3>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" /> Add Ingredient
                </button>
              </div>

              <div className="space-y-3">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2.5 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Ingredient name (e.g. boneless chicken breast)"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                      className="flex-1 border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="number"
                      required
                      min={0.01}
                      step="any"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, "quantity", e.target.value)}
                      className="w-20 border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                    <select
                      value={ing.unit}
                      onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                      className="w-24 border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 animate-none"
                    >
                      <option value="g">grams</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="liter">liters</option>
                      <option value="cup">cups</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                      <option value="piece">piece</option>
                      <option value="whole">whole</option>
                      <option value="clove">cloves</option>
                    </select>
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-red-500 hover:text-red-600 p-2 cursor-pointer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Steps Field list */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-zinc-900 dark:text-white text-lg">Preparation Instructions</h3>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" /> Add Step
                </button>
              </div>

              <div className="space-y-3">
                {preparationSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="h-6 w-6 rounded-full bg-amber-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-500 font-bold text-xs flex items-center justify-center shrink-0 mt-2">
                      {idx + 1}
                    </span>
                    <textarea
                      required
                      placeholder={`Instruction details for step ${idx + 1}...`}
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      rows={2}
                      className="flex-1 border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                    {preparationSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-red-500 hover:text-red-600 p-2 mt-2 cursor-pointer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <Sparkles className="h-5 w-5 animate-pulse" /> Create Recipe & Auto-Analyze
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
