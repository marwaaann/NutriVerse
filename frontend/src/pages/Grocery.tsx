import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { showToast } from "../utils/toast";
import { recipeService, type RecipeResponse } from "../services/recipeService";
import { 
  ShoppingCart, 
  Check, 
  Trash2, 
  MessageCircle, 
  Plus, 
  Copy, 
  BookOpen, 
  Edit2, 
  X, 
  ListPlus, 
  ListChecks
} from "lucide-react";

interface GroceryItem {
  _id?: string;
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  purchased: boolean;
}

interface GroceryList {
  _id: string;
  userId?: string;
  title: string;
  recipeId?: string;
  startDate?: string;
  endDate?: string;
  items: GroceryItem[];
  createdAt?: string;
  updatedAt?: string;
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
  const navigate = useNavigate();

  const recipeId = searchParams.get("recipeId");
  const listIdParam = searchParams.get("listId");

  // State for recipe preview mode
  const [activeRecipe, setActiveRecipe] = useState<RecipeResponse | null>(null);
  const [recipeShoppingItems, setRecipeShoppingItems] = useState<GroceryItem[]>([]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [isSavingRecipeList, setIsSavingRecipeList] = useState(false);

  // Active view mode: 'recipe' (previewing ingredients of a recipe) or 'lists' (user's saved grocery lists)
  const [viewMode, setViewMode] = useState<"recipe" | "lists">(recipeId ? "recipe" : "lists");

  // State for all grocery lists
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(listIdParam || null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  // Inline editing of list title
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Creating a new custom list
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");

  // Adding item to currently selected list
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Copy button feedback
  const [copied, setCopied] = useState(false);

  // Derived selected list object
  const selectedList = useMemo(() => {
    if (!lists.length) return null;
    if (selectedListId) {
      const found = lists.find((l) => l._id === selectedListId);
      if (found) return found;
    }
    return lists[0] || null;
  }, [lists, selectedListId]);

  // Load all saved grocery lists
  const loadLists = async (preferredId?: string) => {
    setIsLoadingLists(true);
    try {
      const res = await axiosInstance.get("/api/mealplanner/grocery?all=true");
      const fetchedLists: GroceryList[] = Array.isArray(res.data.data) ? res.data.data : [];
      setLists(fetchedLists);

      if (preferredId) {
        setSelectedListId(preferredId);
      } else if (listIdParam && fetchedLists.some((l) => l._id === listIdParam)) {
        setSelectedListId(listIdParam);
      } else if (fetchedLists.length > 0 && !selectedListId) {
        setSelectedListId(fetchedLists[0]._id);
      }
    } catch (err) {
      console.error("Failed to load grocery lists:", err);
      showToast.error("Failed to load grocery lists.");
    } finally {
      setIsLoadingLists(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  // Update selected list when listId query param changes
  useEffect(() => {
    if (listIdParam) {
      setSelectedListId(listIdParam);
      setViewMode("lists");
    }
  }, [listIdParam]);

  // Load recipe if recipeId is passed in URL
  useEffect(() => {
    if (recipeId) {
      setIsRecipeLoading(true);
      setViewMode("recipe");
      recipeService.getRecipe(recipeId)
        .then((rec) => {
          setActiveRecipe(rec);
          const items: GroceryItem[] = rec.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: "Recipe Ingredients",
            purchased: false
          }));
          setRecipeShoppingItems(items);
        })
        .catch((err) => {
          console.error("Failed to load recipe:", err);
          showToast.error("Failed to load recipe ingredients.");
        })
        .finally(() => {
          setIsRecipeLoading(false);
        });
    } else {
      setActiveRecipe(null);
      setViewMode("lists");
    }
  }, [recipeId]);

  // Toggle item in recipe preview mode
  const handleToggleRecipeItem = (index: number) => {
    setRecipeShoppingItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        purchased: !updated[index].purchased
      };
      return updated;
    });
  };

  // Save recipe list as a new grocery list entry
  const handleSaveRecipeList = async () => {
    if (!activeRecipe) return;
    setIsSavingRecipeList(true);
    try {
      const response = await axiosInstance.post("/api/mealplanner/grocery", {
        title: activeRecipe.title,
        recipeId: activeRecipe._id,
        items: recipeShoppingItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: "Recipe Ingredients",
          purchased: item.purchased
        }))
      });

      const savedList = response.data.data;
      showToast.success(`Grocery list "${savedList.title}" saved!`);

      // Add to lists and select it
      setLists((prev) => [savedList, ...prev.filter((l) => l._id !== savedList._id)]);
      setSelectedListId(savedList._id);
      setViewMode("lists");

      // Navigate to grocery list page with saved list in view
      navigate(`/grocery?listId=${savedList._id}`, { replace: true });
    } catch (err) {
      console.error("Failed to save recipe grocery list:", err);
      showToast.error("Failed to save grocery list.");
    } finally {
      setIsSavingRecipeList(false);
    }
  };

  // Create a new blank grocery list
  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      showToast.error("Please enter a list title.");
      return;
    }

    try {
      const response = await axiosInstance.post("/api/mealplanner/grocery", {
        title: newListName.trim(),
        items: []
      });

      const created = response.data.data;
      setLists((prev) => [created, ...prev]);
      setSelectedListId(created._id);
      setNewListName("");
      setIsCreatingList(false);
      showToast.success(`Created "${created.title}"`);
      navigate(`/grocery?listId=${created._id}`, { replace: true });
    } catch (err) {
      console.error("Failed to create grocery list:", err);
      showToast.error("Failed to create grocery list.");
    }
  };

  // Edit list title
  const handleStartEditingTitle = (list: GroceryList) => {
    setEditingListId(list._id);
    setEditingTitle(list.title);
  };

  const handleSaveEditedTitle = async (listId: string) => {
    if (!editingTitle.trim()) {
      showToast.error("List title cannot be empty.");
      return;
    }

    try {
      const response = await axiosInstance.put(`/api/mealplanner/grocery/${listId}`, {
        title: editingTitle.trim()
      });

      const updated = response.data.data;
      setLists((prev) => prev.map((l) => (l._id === listId ? { ...l, title: updated.title } : l)));
      setEditingListId(null);
      showToast.success("List title updated!");
    } catch (err) {
      console.error("Failed to update list title:", err);
      showToast.error("Failed to update list title.");
    }
  };

  // Delete a grocery list
  const handleDeleteList = async (listId: string, listTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${listTitle}"?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/mealplanner/grocery/${listId}`);
      showToast.success(`Deleted "${listTitle}"`);

      const remaining = lists.filter((l) => l._id !== listId);
      setLists(remaining);

      if (selectedListId === listId) {
        const nextId = remaining[0]?._id || null;
        setSelectedListId(nextId);
        if (nextId) {
          navigate(`/grocery?listId=${nextId}`, { replace: true });
        } else {
          navigate("/grocery", { replace: true });
        }
      }
    } catch (err) {
      console.error("Failed to delete grocery list:", err);
      showToast.error("Failed to delete grocery list.");
    }
  };

  // Toggle item purchased in selected list
  const handleToggleSelectedItem = async (itemIndex: number) => {
    if (!selectedList) return;

    const updatedItems = [...selectedList.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      purchased: !updatedItems[itemIndex].purchased
    };

    setLists((prev) =>
      prev.map((l) => (l._id === selectedList._id ? { ...l, items: updatedItems } : l))
    );

    try {
      await axiosInstance.put(`/api/mealplanner/grocery/${selectedList._id}`, {
        items: updatedItems
      });
    } catch (err) {
      console.error("Failed to update item:", err);
      showToast.error("Failed to update item.");
      loadLists(selectedList._id);
    }
  };

  // Add custom item to selected list
  const handleAddItemToSelectedList = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedList || !newItemName.trim()) return;

    setIsAddingItem(true);
    const newItem: GroceryItem = {
      name: newItemName.trim(),
      quantity: newItemQty > 0 ? newItemQty : 1,
      unit: newItemUnit,
      purchased: false
    };

    const updatedItems = [...selectedList.items, newItem];

    try {
      const res = await axiosInstance.put(`/api/mealplanner/grocery/${selectedList._id}`, {
        items: updatedItems
      });
      const updatedList = res.data.data;
      setLists((prev) => prev.map((l) => (l._id === selectedList._id ? updatedList : l)));
      setNewItemName("");
      setNewItemQty(1);
      setNewItemUnit("pcs");
      showToast.success(`Added "${newItem.name}"`);
    } catch (err) {
      console.error("Failed to add item:", err);
      showToast.error("Failed to add item.");
    } finally {
      setIsAddingItem(false);
    }
  };

  // Remove item from selected list
  const handleRemoveItemFromSelectedList = async (itemIndex: number) => {
    if (!selectedList) return;

    const removedItemName = selectedList.items[itemIndex]?.name;
    const updatedItems = selectedList.items.filter((_, i) => i !== itemIndex);

    setLists((prev) =>
      prev.map((l) => (l._id === selectedList._id ? { ...l, items: updatedItems } : l))
    );

    try {
      await axiosInstance.put(`/api/mealplanner/grocery/${selectedList._id}`, {
        items: updatedItems
      });
      showToast.success(`Removed "${removedItemName}"`);
    } catch (err) {
      console.error("Failed to remove item:", err);
      showToast.error("Failed to remove item.");
      loadLists(selectedList._id);
    }
  };

  // Copy list to clipboard
  const handleCopyList = async () => {
    const isRecipe = viewMode === "recipe" && activeRecipe;
    const title = isRecipe ? activeRecipe.title : (selectedList?.title || "Grocery List");
    const items = isRecipe ? recipeShoppingItems : (selectedList?.items || []);

    if (items.length === 0) {
      showToast.error("No items to copy.");
      return;
    }

    let text = `🛒 NutriVerse Shopping List — ${title}\n`;
    text += `Required Items (${items.length}):\n\n`;
    items.forEach((item) => {
      const check = item.purchased ? "✅" : "☐";
      text += `${check} ${item.name} (${item.quantity} ${item.unit})\n`;
    });
    text += `\nGenerated by NutriVerse`;

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
      showToast.success("List copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy list:", err);
      showToast.error("Failed to copy list.");
    }
  };

  // Share list to WhatsApp
  const handleShareWhatsApp = () => {
    const isRecipe = viewMode === "recipe" && activeRecipe;
    const title = isRecipe ? activeRecipe.title : (selectedList?.title || "Grocery List");
    const items = isRecipe ? recipeShoppingItems : (selectedList?.items || []);

    if (items.length === 0) {
      showToast.error("No items to share.");
      return;
    }

    let message = `🛒 *NutriVerse Shopping List*\n`;
    message += `List: *${title}*\n\n`;
    message += `*REQUIRED ITEMS TO BUY:*\n`;
    items.forEach((item) => {
      const check = item.purchased ? "✅" : "☐";
      message += `${check} ${item.name} (${item.quantity} ${item.unit})\n`;
    });
    message += `\nGenerated by NutriVerse Assistant`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  // Compute stats for selected list
  const selectedBoughtCount = selectedList?.items.filter((i) => i.purchased).length || 0;
  const selectedTotalCount = selectedList?.items.length || 0;
  const progressPercent = selectedTotalCount > 0 ? Math.round((selectedBoughtCount / selectedTotalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <ShoppingCart className="h-8 w-8 text-amber-500" />
            {viewMode === "recipe" && activeRecipe ? "Recipe Shopping List" : "Your Grocery Lists"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {viewMode === "recipe" && activeRecipe
              ? `Required shop list of ingredients needed to buy for "${activeRecipe.title}".`
              : "Organize, shop, and manage your grocery lists for every recipe and meal plan."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleCopyList}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            title="Copy shopping list in plain text"
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

      {/* Switcher if navigated from a recipe */}
      {activeRecipe && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setViewMode("recipe")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === "recipe"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Recipe Shopping List ({recipeShoppingItems.length} items)
          </button>
          <button
            onClick={() => setViewMode("lists")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              viewMode === "lists"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" />
            My Grocery Lists ({lists.length})
          </button>
        </div>
      )}

      {/* VIEW 1: RECIPE SHOPPING LIST PREVIEW */}
      {viewMode === "recipe" && activeRecipe && (
        <div className="space-y-6">
          {/* Banner Card: Contains Recipe info, Save List button. Back to Recipe button & category removed */}
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
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                  {activeRecipe.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {recipeShoppingItems.filter((i) => i.purchased).length} of {recipeShoppingItems.length}
                  </span>{" "}
                  ingredients marked as bought
                </p>
              </div>
            </div>

            {/* Save List Button (replaces Add to Full Catalog & Back to Recipe is removed) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleSaveRecipeList}
                disabled={isSavingRecipeList}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                title="Save this shopping list as a new grocery list"
              >
                <ListPlus className="h-4 w-4" />
                {isSavingRecipeList ? "Saving..." : "Save List"}
              </button>
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

      {/* VIEW 2: GROCERY LISTS PAGE (User's Saved Lists, Edit, Delete, Checklists) */}
      {viewMode === "lists" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: List of All Saved Grocery Lists */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-zinc-900 dark:text-white">
                    My Grocery Lists
                  </h2>
                  <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    {lists.length}
                  </span>
                </div>

                <button
                  onClick={() => setIsCreatingList((prev) => !prev)}
                  className="flex items-center gap-1 text-xs font-bold bg-zinc-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl transition cursor-pointer"
                  title="Create a new grocery list"
                >
                  <Plus className="h-3.5 w-3.5" /> New List
                </button>
              </div>

              {/* Inline Create New List Input */}
              {isCreatingList && (
                <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    New List Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly Groceries, BBQ Party..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNewList();
                    }}
                    autoFocus
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-900 dark:text-white"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setIsCreatingList(false);
                        setNewListName("");
                      }}
                      className="px-3 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateNewList}
                      className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition cursor-pointer"
                    >
                      Create
                    </button>
                  </div>
                </div>
              )}

              {/* List Cards */}
              {isLoadingLists ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                    No Grocery Lists Yet
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Click "+ New List" above or "Save List" on any recipe to create one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {lists.map((list) => {
                    const isSelected = selectedList?._id === list._id;
                    const bought = list.items.filter((i) => i.purchased).length;
                    const total = list.items.length;

                    return (
                      <div
                        key={list._id}
                        onClick={() => {
                          setSelectedListId(list._id);
                          navigate(`/grocery?listId=${list._id}`, { replace: true });
                        }}
                        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-sm ring-1 ring-amber-400/40"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3
                              className={`text-sm font-bold truncate ${
                                isSelected
                                  ? "text-amber-900 dark:text-amber-200"
                                  : "text-zinc-900 dark:text-white"
                              }`}
                            >
                              {list.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {total} {total === 1 ? "item" : "items"}
                              </span>
                              {total > 0 && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      bought === total
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {bought}/{total} bought
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons on Card */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditingTitle(list);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-amber-100/50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                              title="Rename list"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list._id, list.title);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                              title="Delete list"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Grocery List Details */}
          <div className="lg:col-span-8 space-y-6">
            {selectedList ? (
              <>
                {/* List Header & Progress Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Title with inline edit */}
                    <div className="flex-1 min-w-0">
                      {editingListId === selectedList._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEditedTitle(selectedList._id);
                              if (e.key === "Escape") setEditingListId(null);
                            }}
                            autoFocus
                            className="text-xl font-bold bg-zinc-50 dark:bg-zinc-800 border border-amber-500 rounded-xl px-3 py-1 text-zinc-900 dark:text-white outline-none w-full"
                          />
                          <button
                            onClick={() => handleSaveEditedTitle(selectedList._id)}
                            className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition cursor-pointer"
                            title="Save title"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingListId(null)}
                            className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl hover:bg-zinc-300 transition cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-2xl font-black text-zinc-900 dark:text-white truncate">
                            {selectedList.title}
                          </h2>
                          <button
                            onClick={() => handleStartEditingTitle(selectedList)}
                            className="p-1.5 text-zinc-400 hover:text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer shrink-0"
                            title="Rename this grocery list"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {selectedTotalCount === 0
                          ? "No items in this list yet."
                          : `${selectedBoughtCount} of ${selectedTotalCount} items marked as bought (${progressPercent}%)`}
                      </p>
                    </div>

                    {/* Delete List Button */}
                    <button
                      onClick={() => handleDeleteList(selectedList._id, selectedList.title)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900/40 transition cursor-pointer shrink-0"
                      title="Delete this entire grocery list"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete List
                    </button>
                  </div>

                  {/* Progress Bar */}
                  {selectedTotalCount > 0 && (
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Add Custom Item to Selected List */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-amber-500" /> Add Item to List
                  </h3>
                  <form onSubmit={handleAddItemToSelectedList} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <input
                      type="text"
                      placeholder="e.g. Olive Oil, Garlic, Eggs..."
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="md:col-span-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-900 dark:text-white"
                    />
                    <div className="md:col-span-3 flex gap-2">
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
                    <button
                      type="submit"
                      disabled={isAddingItem || !newItemName.trim()}
                      className="md:col-span-3 bg-zinc-900 hover:bg-black dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" /> Add Item
                    </button>
                  </form>
                </div>

                {/* Items Checklist Panel (No Breakfast/Main Course classification) */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="font-extrabold text-sm uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                      Items Checklist ({selectedList.items.length})
                    </h3>
                    <span className="text-xs text-zinc-400 font-semibold">
                      Click checkbox to mark as purchased
                    </span>
                  </div>

                  {selectedList.items.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-sm space-y-2">
                      <div className="text-3xl">📝</div>
                      <p className="font-semibold">This grocery list is currently empty.</p>
                      <p className="text-xs text-zinc-400">
                        Use the form above to add ingredients and shopping items.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {selectedList.items.map((item, idx) => (
                        <div
                          key={item._id || idx}
                          className="flex justify-between items-center py-3.5 px-2 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 rounded-xl transition"
                        >
                          <div
                            onClick={() => handleToggleSelectedItem(idx)}
                            className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                          >
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
                              className={`text-sm truncate ${
                                item.purchased
                                  ? "line-through text-zinc-400 font-medium"
                                  : "text-zinc-800 dark:text-white font-semibold"
                              }`}
                            >
                              {item.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                              {item.quantity} {item.unit}
                            </span>

                            <button
                              onClick={() => handleRemoveItemFromSelectedList(idx)}
                              className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto text-2xl">
                  🛒
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                  No Grocery List Selected
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  Select a grocery list from the left panel or click "+ New List" to start a new shopping list.
                </p>
                <button
                  onClick={() => setIsCreatingList(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  Create Your First List
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
