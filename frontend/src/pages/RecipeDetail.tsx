import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { recipeService } from "../services/recipeService";
import type { RecipeResponse } from "../services/recipeService";
import { ArrowLeft, Clock, Users, Flame, HeartPulse, RefreshCw, ShoppingCart } from "lucide-react";

export const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      recipeService.getRecipe(id)
        .then((data) => {
          setRecipe(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load recipe:", err);
          setError("Recipe not found or failed to load.");
          setIsLoading(false);
        });
    }
  }, [id]);

  const handleAnalyzeNutrition = async () => {
    if (!id || !recipe) return;
    setIsAnalyzing(true);
    try {
      const updatedNutrition = await recipeService.analyzeNutrition(id);
      if (updatedNutrition) {
        // Reload recipe
        const refreshedRecipe = await recipeService.getRecipe(id);
        setRecipe(refreshedRecipe);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to analyze nutrition. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-pulse">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-red-500">
        <p>{error || "Recipe not found."}</p>
        <Link to="/recipes" className="text-amber-500 hover:underline mt-4 inline-block">Back to recipes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        to="/recipes"
        className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-500 font-semibold mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Recipes
      </Link>

      {/* Main Recipe Detail Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm p-6 md:p-8">
        
        {/* Title and metadata */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {recipe.category && (
              <span className="text-xs uppercase font-bold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full">
                {recipe.category}
              </span>
            )}
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {recipe.cookingTime} mins
            </span>
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {recipe.servings} servings
            </span>
          </div>
          
          <div className="flex justify-between items-start gap-4 mb-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(`/grocery?recipeId=${recipe._id}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                title="View required shopping list of ingredients in Grocery"
              >
                <ShoppingCart className="h-4 w-4" /> Shop Ingredients
              </button>
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this recipe?")) {
                    try {
                      await recipeService.deleteRecipe(recipe._id);
                      navigate("/recipes");
                    } catch (err) {
                      console.error(err);
                      alert("Failed to delete recipe.");
                    }
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
            {recipe.description || "No description provided."}
          </p>
        </div>

        {/* Image */}
        {recipe.image && (
          <div className="relative h-96 w-full rounded-2xl overflow-hidden mb-8 shadow-inner">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Nutrition Card / Panel */}
        {recipe.nutrition && (
          <div className="bg-amber-50/50 dark:bg-zinc-800/40 rounded-2xl border border-amber-100 dark:border-zinc-800 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-amber-500" />
                AI Calculated Nutrition
              </h3>
              <button
                onClick={handleAnalyzeNutrition}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Analyzing..." : "Recalculate"}
              </button>
            </div>

            {/* Total and Per Serving Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Calories</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1 flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 text-orange-500" /> {recipe.nutrition.calories}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Calories / Serving</div>
                <div className="text-2xl font-black text-orange-600 dark:text-orange-500 mt-1">
                  {recipe.caloriesPerServing || Math.round(recipe.nutrition.calories / recipe.servings)}
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Protein / Serving</div>
                <div className="text-2xl font-black text-green-600 dark:text-green-500 mt-1">
                  {recipe.proteinPerServing || Math.round((recipe.nutrition.protein / recipe.servings) * 10) / 10}g
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Carbs / Serving</div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1">
                  {recipe.carbohydratesPerServing || Math.round((recipe.nutrition.carbohydrates / recipe.servings) * 10) / 10}g
                </div>
              </div>
            </div>

            {/* Total Nutritional Breakdown Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                <thead className="text-xs text-zinc-700 dark:text-zinc-300 uppercase bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th scope="col" className="px-4 py-2">Nutrient</th>
                    <th scope="col" className="px-4 py-2 text-right">Total Amount</th>
                    <th scope="col" className="px-4 py-2 text-right">Amount Per Serving</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b dark:border-zinc-800">
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">Protein</td>
                    <td className="px-4 py-2 text-right">{recipe.nutrition.protein}g</td>
                    <td className="px-4 py-2 text-right">{Math.round((recipe.nutrition.protein / recipe.servings) * 10) / 10}g</td>
                  </tr>
                  <tr className="border-b dark:border-zinc-800">
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">Carbohydrates</td>
                    <td className="px-4 py-2 text-right">{recipe.nutrition.carbohydrates}g</td>
                    <td className="px-4 py-2 text-right">{Math.round((recipe.nutrition.carbohydrates / recipe.servings) * 10) / 10}g</td>
                  </tr>
                  <tr className="border-b dark:border-zinc-800">
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">Fat</td>
                    <td className="px-4 py-2 text-right">{recipe.nutrition.fat}g</td>
                    <td className="px-4 py-2 text-right">{Math.round((recipe.nutrition.fat / recipe.servings) * 10) / 10}g</td>
                  </tr>
                  {recipe.nutrition.fiber !== undefined && (
                    <tr className="border-b dark:border-zinc-800">
                      <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">Fiber</td>
                      <td className="px-4 py-2 text-right">{recipe.nutrition.fiber}g</td>
                      <td className="px-4 py-2 text-right">{Math.round((recipe.nutrition.fiber / recipe.servings) * 10) / 10}g</td>
                    </tr>
                  )}
                  {recipe.nutrition.sugar !== undefined && (
                    <tr className="border-b dark:border-zinc-800">
                      <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">Sugar</td>
                      <td className="px-4 py-2 text-right">{recipe.nutrition.sugar}g</td>
                      <td className="px-4 py-2 text-right">{Math.round((recipe.nutrition.sugar / recipe.servings) * 10) / 10}g</td>
                    </tr>
                  )}
                  {recipe.nutrition.sodium !== undefined && (
                    <tr className="border-b dark:border-zinc-800">
                      <td className="px-4 py-2 font-medium text-zinc-900 dark:text-white">Sodium</td>
                      <td className="px-4 py-2 text-right">{recipe.nutrition.sodium}mg</td>
                      <td className="px-4 py-2 text-right">{Math.round(recipe.nutrition.sodium / recipe.servings)}mg</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ingredients list */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Ingredients</h2>
            <button
              onClick={() => navigate(`/grocery?recipeId=${recipe._id}`)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-bold transition border border-amber-200 dark:border-amber-800 cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> View in Grocery List
            </button>
          </div>
          <ul className="space-y-3">
            {recipe.ingredients.map((ing, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {ing.quantity} {ing.unit} {ing.name}
                  </span>
                  {ing.normalizedName && ing.normalizedName !== ing.name && (
                    <span className="text-[10px] text-zinc-400 capitalize">({ing.normalizedName})</span>
                  )}
                </div>
                {ing.calories !== undefined && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {ing.calories} kcal | P: {ing.protein}g | C: {ing.carbohydrates}g | F: {ing.fat}g
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Preparation Steps */}
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-4">Preparation Instructions</h2>
          <ol className="space-y-4">
            {recipe.preparationSteps.map((step, idx) => (
              <li key={idx} className="flex gap-4 items-start">
                <span className="h-6 w-6 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed pt-0.5">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  );
};
