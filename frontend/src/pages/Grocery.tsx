import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { showToast } from "../utils/toast";
import { recipeService, type RecipeResponse } from "../services/recipeService";
import { 
  ShoppingCart, 
  Check, 
  Trash2, 
  RefreshCw, 
  MessageCircle,
  Plus,
  Copy,
  BookOpen,
  ArrowLeft
} from "lucide-react";

interface GroceryItem {
  _id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
}

interface GroceryList {
  _id: string;
  startDate: string;
  endDate: string;
  items: GroceryItem[];
}

const UNIT_OPTIONS = [
  "pcs",
  "count",
  "units",
  "g",
  "kg",
  "ml",
  "l",
  "pack",
  "bunch",
  "can",
  "bottle",
  "box",
  "cup",
  "tbsp",
  "tsp",
  "slice"
];

export const Grocery: React.FC = () => {
  const [searchParams] = useSearchParams();
  const recipeId = searchParams.get("recipeId");
  const [activeRecipe, setActiveRecipe] = useState<RecipeResponse | null>(null);
  const [recipeShoppingItems, setRecipeShoppingItems] = useState<GroceryItem[]>([]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"recipe" | "catalog">(recipeId ? "recipe" : "catalog");

  const [rangeType, setRangeType] = useState<"today" | "3days" | "week">("today");
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemCategory, setNewItemCategory] = useState("Other");

  // Calculate dates based on range selection
  const getDates = () => {
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    
    let endDate = startDate;
    if (rangeType === "3days") {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      endDate = d.toISOString().split("T")[0];
    } else if (rangeType === "week") {
      const d = new Date();
      d.setDate(d.getDate() + 6);
      endDate = d.toISOString().split("T")[0];
    }

    return { startDate, endDate };
  };

  const loadGroceryList = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDates();
    try {
      const response = await axiosInstance.get(`/api/mealplanner/grocery?startDate=${startDate}&endDate=${endDate}`);
      setGroceryList(response.data.data);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to load grocery list.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateList = async () => {
    setIsLoading(true);
    const { startDate, endDate } = getDates();
    try {
      const response = await axiosInstance.post("/api/mealplanner/grocery/generate", { startDate, endDate });
      setGroceryList(response.data.data);
      showToast.success("Grocery list updated based on active meals!");
    } catch (err) {
      console.error(err);
      showToast.error("Failed to regenerate grocery list.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroceryList();
  }, [rangeType]);

  const handleToggleItem = async (itemIndex: number) => {
    if (!groceryList) return;
    
    const updatedItems = [...groceryList.items];
    updatedItems[itemIndex].purchased = !updatedItems[itemIndex].purchased;

    try {
      const response = await axiosInstance.put(`/api/mealplanner/grocery/${groceryList._id}`, {
        items: updatedItems
      });
      setGroceryList(response.data.data);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to update item status.");
    }
  };

  const handleAddItem = async () => {
    if (!groceryList || !newItemName.trim()) return;

    const newItem: GroceryItem = {
      name: newItemName.trim(),
      quantity: newItemQty,
      unit: newItemUnit,
      category: newItemCategory,
      purchased: false
    };

    const updatedItems = [...groceryList.items, newItem];

    try {
      const response = await axiosInstance.put(`/api/mealplanner/grocery/${groceryList._id}`, {
        items: updatedItems
      });
      setGroceryList(response.data.data);
      setNewItemName("");
      setNewItemQty(1);
      setNewItemUnit("pcs");
      showToast.success(`Added "${newItemName}" to shopping list`);
    } catch (err) {
      console.error(err);
      showToast.error("Failed to add custom item.");
    }
  };

  const handleRemoveItem = async (itemIndex: number) => {
    if (!groceryList) return;

    const updatedItems = groceryList.items.filter((_, i) => i !== itemIndex);

    try {
      const response = await axiosInstance.put(`/api/mealplanner/grocery/${groceryList._id}`, {
        items: updatedItems
      });
      setGroceryList(response.data.data);
      showToast.success("Item removed");
    } catch (err) {
      console.error(err);
      showToast.error("Failed to remove item.");
    }
  };

  // Load recipe if recipeId is passed in URL
  useEffect(() => {
    if (recipeId) {
      setIsRecipeLoading(true);
      setActiveTab("recipe");
      recipeService.getRecipe(recipeId)
        .then((rec) => {
          setActiveRecipe(rec);
          const storageKey = `nutriverse_recipe_shop_${rec._id}`;
          let savedPurchased: Record<string, boolean> = {};
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) savedPurchased = JSON.parse(raw);
          } catch {}

          const items: GroceryItem[] = rec.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: rec.category || "Produce",
            purchased: !!savedPurchased[ing.name]
          }));
          setRecipeShoppingItems(items);
        })
        .catch((err) => {
          console.error("Failed to load recipe ingredients:", err);
          showToast.error("Failed to load recipe ingredients.");
        })
        .finally(() => {
          setIsRecipeLoading(false);
        });
    } else {
      setActiveRecipe(null);
      setActiveTab("catalog");
    }
  }, [recipeId]);

  const handleToggleRecipeItem = (index: number) => {
    setRecipeShoppingItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        purchased: !updated[index].purchased
      };
      if (activeRecipe) {
        const storageKey = `nutriverse_recipe_shop_${activeRecipe._id}`;
        const map: Record<string, boolean> = {};
        updated.forEach((it) => {
          map[it.name] = it.purchased;
        });
        try {
          localStorage.setItem(storageKey, JSON.stringify(map));
        } catch {}
      }
      return updated;
    });
  };

  const handleMergeRecipeIntoCatalog = async () => {
    if (!activeRecipe || !groceryList) {
      showToast.error("Grocery catalog not ready yet.");
      return;
    }
    try {
      const existingNames = new Set(groceryList.items.map((i) => i.name.trim().toLowerCase()));
      const newItems: GroceryItem[] = [];
      recipeShoppingItems.forEach((ing) => {
        if (!existingNames.has(ing.name.trim().toLowerCase())) {
          newItems.push({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: activeRecipe.category || "Recipe Ingredients",
            purchased: false
          });
        }
      });

      if (newItems.length === 0) {
        showToast.success("All recipe ingredients are already in your catalog!");
        return;
      }

      const updated = [...groceryList.items, ...newItems];
      const response = await axiosInstance.put(`/api/mealplanner/grocery/${groceryList._id}`, {
        items: updated
      });
      setGroceryList(response.data.data);
      showToast.success(`Added ${newItems.length} ingredients to your Grocery Catalog!`);
    } catch (err) {
      console.error("Failed to add recipe items to catalog:", err);
      showToast.error("Failed to add ingredients to catalog.");
    }
  };

  const handleShareWhatsApp = () => {
    const isRecipeView = activeTab === "recipe" && activeRecipe;
    const itemsToShare = isRecipeView ? recipeShoppingItems : (groceryList?.items || []);

    if (itemsToShare.length === 0) {
      showToast.error("No items to share");
      return;
    }

    let message = "";
    if (isRecipeView) {
      message += `🛒 *NutriVerse Shopping List*\n`;
      message += `Recipe: *${activeRecipe.title}*\n\n`;
      message += `*REQUIRED INGREDIENTS TO BUY:*\n`;
      itemsToShare.forEach((item) => {
        const check = item.purchased ? "✅" : "☐";
        message += `${check} ${item.name} (${item.quantity} ${item.unit})\n`;
      });
      message += `\nGenerated by NutriVerse Assistant`;
    } else {
      message += `🛒 *NutriVerse Family Grocery List* \n`;
      message += `Range: ${groceryList?.startDate} to ${groceryList?.endDate}\n\n`;

      const grouped: Record<string, GroceryItem[]> = {};
      itemsToShare.forEach(item => {
        const cat = item.category || "Other";
        if (!grouped[cat]) {
          grouped[cat] = [];
        }
        grouped[cat].push(item);
      });

      Object.entries(grouped).forEach(([category, list]) => {
        message += `*${category.toUpperCase()}*\n`;
        list.forEach(item => {
          const check = item.purchased ? "✅" : "☐";
          message += `${check} ${item.name} (${item.quantity} ${item.unit})\n`;
        });
        message += `\n`;
      });

      message += `Generated by NutriVerse Assistant`;
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyList = async () => {
    const isRecipeView = activeTab === "recipe" && activeRecipe;
    const itemsToCopy = isRecipeView ? recipeShoppingItems : (groceryList?.items || []);

    if (itemsToCopy.length === 0) {
      showToast.error("No items to copy");
      return;
    }

    let text = "";
    if (isRecipeView) {
      text += `🛒 NutriVerse Shopping List — ${activeRecipe.title}\n`;
      text += `Required Ingredients to Buy (${itemsToCopy.length} items):\n\n`;
      itemsToCopy.forEach((item) => {
        const check = item.purchased ? "✅" : "☐";
        text += `${check} ${item.name} (${item.quantity} ${item.unit})\n`;
      });
      text += `\nGenerated by NutriVerse`;
    } else {
      text += `🛒 NutriVerse Grocery List\n`;
      text += `Range: ${groceryList?.startDate} to ${groceryList?.endDate}\n\n`;

      const grouped: Record<string, GroceryItem[]> = {};
      itemsToCopy.forEach((item) => {
        const cat = item.category || "Other";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });

      Object.entries(grouped).forEach(([category, list]) => {
        text += `${category.toUpperCase()}:\n`;
        list.forEach((item) => {
          const check = item.purchased ? "✅" : "☐";
          text += `${check} ${item.name} (${item.quantity} ${item.unit})\n`;
        });
        text += `\n`;
      });
      text += `Generated by NutriVerse`;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast.success("Shopping list copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy list:", err);
      showToast.error("Failed to copy list.");
    }
  };

  // Group items by category for UI display
  const getGroupedItems = () => {
    if (!groceryList) return {};
    const grouped: Record<string, { idx: number; item: GroceryItem }[]> = {};
    groceryList.items.forEach((item, index) => {
      const cat = item.category || "Other";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push({ idx: index, item });
    });
    return grouped;
  };

  const groupedItems = getGroupedItems();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <ShoppingCart className="h-8 w-8 text-amber-500" />
            {activeTab === "recipe" && activeRecipe ? "Recipe Shopping List" : "Your Grocery Catalog"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {activeTab === "recipe" && activeRecipe
              ? `Required shop list of ingredients needed to buy for ${activeRecipe.title}.`
              : "Aggregated shopping ingredients combined automatically from active meal plans."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeTab === "catalog" && (
            <button
              onClick={handleRegenerateList}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" /> Recalculate Items
            </button>
          )}

          <button
            onClick={handleCopyList}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            title="Copy shopping list in plain text to clipboard"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy List</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
            title="Share shopping list to WhatsApp"
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </button>
        </div>
      </div>

      {/* Tabs Switcher if coming from a recipe */}
      {activeRecipe && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("recipe")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "recipe"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Recipe: {activeRecipe.title} ({recipeShoppingItems.length} items)
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "catalog"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Full Meal Catalog
          </button>
        </div>
      )}

      {/* RECIPE SHOPPING LIST VIEW */}
      {activeTab === "recipe" && activeRecipe && (
        <div className="space-y-6">
          {/* Recipe Card Banner */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {activeRecipe.image ? (
                <img
                  src={activeRecipe.image}
                  alt={activeRecipe.title}
                  className="w-20 h-20 rounded-2xl object-cover border border-zinc-100 dark:border-zinc-800 shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-3xl shrink-0">
                  🍳
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Required Shopping List
                  </span>
                  {activeRecipe.category && (
                    <span className="text-xs font-bold text-zinc-400">
                      • {activeRecipe.category}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                  {activeRecipe.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {recipeShoppingItems.filter(i => i.purchased).length} of {recipeShoppingItems.length}
                  </span>{" "}
                  ingredients marked as bought
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleMergeRecipeIntoCatalog}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                title="Add all recipe ingredients into your persistent grocery catalog"
              >
                <Plus className="h-3.5 w-3.5 text-amber-500" /> Add to Full Catalog
              </button>
              <Link
                to={`/recipes/${activeRecipe._id}`}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Recipe
              </Link>
            </div>
          </div>

          {/* Checklist Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-extrabold text-sm uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                Required Ingredients ({recipeShoppingItems.length})
              </h3>
              <span className="text-xs text-zinc-400 font-semibold">
                Click checkbox when purchased
              </span>
            </div>

            {isRecipeLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                ))}
              </div>
            ) : recipeShoppingItems.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No ingredients found for this recipe.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {recipeShoppingItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleRecipeItem(idx)}
                    className="flex justify-between items-center py-3.5 px-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                          item.purchased
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-zinc-300 dark:border-zinc-700 hover:border-amber-500"
                        }`}
                      >
                        {item.purchased && <Check className="h-3 w-3" />}
                      </div>

                      <span
                        className={`text-sm ${
                          item.purchased
                            ? "line-through text-zinc-400 font-medium"
                            : "text-zinc-800 dark:text-white font-semibold"
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATALOG VIEW (All Meal Groceries) */}
      {(!activeRecipe || activeTab === "catalog") && (
        <>
          {/* Date Range Filters */}
          <div className="flex gap-2.5 mb-8">
            {[
              { type: "today", label: "Today's Groceries" },
              { type: "3days", label: "Next 3 Days" },
              { type: "week", label: "This Week" }
            ].map(btn => (
              <button
                key={btn.type}
                onClick={() => setRangeType(btn.type as any)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  rangeType === btn.type
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Quick Add Custom Item form */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm mb-8">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Add Custom Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="e.g. Olive Oil, Garlic"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-900 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value))}
                  className="w-20 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-900 dark:text-white"
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-900 dark:text-white cursor-pointer"
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-900 dark:text-white"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Protein">Protein</option>
                <option value="Dairy">Dairy</option>
                <option value="Grains">Grains</option>
                <option value="Spices">Spices</option>
                <option value="Other">Other</option>
              </select>
              <button
                onClick={handleAddItem}
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
          </div>

          {/* Main List */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
              ))}
            </div>
          ) : !groceryList || groceryList.items.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-12 rounded-3xl text-center space-y-4">
              <span className="text-4xl">🛒</span>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Shopping Catalog Empty</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                No active meal plans found for this date range. Go back to Home to schedule your meals.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, list]) => (
                <div key={category} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-sm uppercase text-amber-800 dark:text-amber-400 tracking-wider mb-4">
                    {category}
                  </h3>
                  
                  <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                    {list.map(({ idx, item }) => (
                      <div key={idx} className="flex justify-between items-center py-3.5 hover:bg-zinc-50/25 transition">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleItem(idx)}
                            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                              item.purchased
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-zinc-300 dark:border-zinc-700 hover:border-amber-500"
                            }`}
                          >
                            {item.purchased && <Check className="h-3 w-3" />}
                          </button>

                          <span className={`text-sm ${
                            item.purchased 
                              ? "line-through text-zinc-400 font-medium" 
                              : "text-zinc-800 dark:text-white font-semibold"
                          }`}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                            {item.quantity} {item.unit}
                          </span>
                          
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
