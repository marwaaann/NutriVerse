import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import { useQueryClient } from "@tanstack/react-query";
import { showToast } from "../utils/toast";
import { 
  User, 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  ShieldAlert, 
  Save,
  Mail,
  Phone
} from "lucide-react";
import { useAppSelector } from "../types/ThemeHookType";
import { useDispatch } from "react-redux";
import { toggleMode } from "../store/themeSlice";

export const Settings: React.FC = () => {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const currentMode = useAppSelector((state) => state.theme.mode);

  const [fullname, setFullname] = useState(user?.fullname || "");
  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "security">("profile");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) {
      showToast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await userService.updateProfile(fullname);
      // Invalidate the auth query to refetch updated info across the app
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      showToast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-indigo-600" /> Account Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize your experience, update profile information, and configure notification settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Tab Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2.5 ${
              activeTab === "profile" 
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <User className="h-4.5 w-4.5" /> Profile Info
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2.5 ${
              activeTab === "appearance" 
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Moon className="h-4.5 w-4.5" /> Appearance
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2.5 ${
              activeTab === "security" 
                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" 
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <ShieldAlert className="h-4.5 w-4.5" /> Security
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Profile</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition"
                  placeholder="Your Full Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500">Contact admin to update your email address.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    value={user?.phone || ""}
                    disabled
                    className="w-full bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm disabled:opacity-50 transition"
              >
                <Save className="h-4.5 w-4.5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Theme Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Toggle between light and dark backgrounds.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => currentMode === "dark" && dispatch(toggleMode())}
                  className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                    currentMode === "light" 
                      ? "border-indigo-600 bg-indigo-50/30 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" 
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Sun className="h-7 w-7" />
                  <span className="text-sm font-semibold">Light Mode</span>
                </button>

                <button
                  onClick={() => currentMode === "light" && dispatch(toggleMode())}
                  className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
                    currentMode === "dark" 
                      ? "border-indigo-600 bg-indigo-900/20 text-indigo-400" 
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <Moon className="h-7 w-7" />
                  <span className="text-sm font-semibold">Dark Mode</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Security Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Review your current account credentials status.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-sm space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  Password Status: <span className="font-semibold text-green-600">Encrypted / Active</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Verification Status: <span className="font-semibold text-indigo-600">{user?.isVerified ? "Verified" : "Pending Verification"}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
