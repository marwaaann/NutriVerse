import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { showToast } from "../utils/toast";
import { 
  ShoppingCart, 
  Check, 
  Trash2, 
  RefreshCw, 
  MessageCircle,
  Plus
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

  const handleShareWhatsApp = () => {
    if (!groceryList || groceryList.items.length === 0) {
      showToast.error("No items to share");
      return;
    }

    // Format message
    let message = `🛒 *NutriVerse Family Grocery List* \n`;
    message += `Range: ${groceryList.startDate} to ${groceryList.endDate}\n\n`;

    // Group items by category for formatted message
    const grouped: Record<string, GroceryItem[]> = {};
    groceryList.items.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
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

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2.5">
            <ShoppingCart className="h-8 w-8 text-amber-500" /> Your Grocery Catalog
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Aggregated shopping ingredients combined automatically from active meal plans.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleRegenerateList}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-sm font-semibold transition"
          >
            <RefreshCw className="h-4 w-4" /> Recalculate Items
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-sm transition"
          >
            <MessageCircle className="h-4 w-4" /> Share on WhatsApp
          </button>
        </div>
      </div>

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
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${
              rangeType === btn.type
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50"
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
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-1.5 transition"
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
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
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
                        className="text-zinc-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-zinc-800 rounded-lg transition"
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
    </div>
  );
};
