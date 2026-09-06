import React, { useEffect, useState } from "react";
import { recipeService } from "../services/recipeService";
import type { RecipeResponse } from "../services/recipeService";
import { Link } from "react-router-dom";
import { Clock, Plus, BookOpen, ChevronRight, Tag } from "lucide-react";

export const RecipesList: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    recipeService.getAllRecipes()
      .then((data) => {
        setRecipes(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load recipes:", err);
        setError("Could not load recipes. Please try again later.");
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-amber-500" />
            NutriVerse Recipes
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Explore healthy and delicious recipes powered by automatic AI nutrition analysis
          </p>
        </div>
        <Link
          to="/recipes/create"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" /> Add Recipe
        </Link>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 dark:text-red-400">{error}</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <BookOpen className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">No Recipes Yet</h3>
          <p className="text-zinc-500 dark:text-zinc-500 mb-6">Create the very first recipe to get started!</p>
          <Link
            to="/recipes/create"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded-xl shadow-lg cursor-pointer"
          >
            <Plus className="h-5 w-5" /> Add Recipe
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe._id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
            >
              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  {recipe.category && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {recipe.category}
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {recipe.cookingTime} mins
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1">
                  {recipe.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-2 flex-1">
                  {recipe.description || "No description provided."}
                </p>
                
                {recipe.nutrition && (
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs mb-4">
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">{recipe.nutrition.calories}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Calories</div>
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">{recipe.nutrition.protein}g</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Protein</div>
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">{recipe.nutrition.fat}g</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Fat</div>
                    </div>
                  </div>
                )}

                <Link
                  to={`/recipes/${recipe._id}`}
                  className="flex items-center justify-center gap-1 w-full bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-500 dark:hover:bg-amber-600 text-zinc-700 dark:text-zinc-200 hover:text-white font-bold py-2 rounded-xl transition-all text-sm cursor-pointer"
                >
                  View Details <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
