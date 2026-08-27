import React, { useEffect, useState } from "react";
import { userService } from "../services/userService";
import type { UserResponse } from "../services/userService";
import { Users as UsersIcon, Search, AlertCircle, Calendar, ShieldCheck, Mail, Phone } from "lucide-react";

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userService.getAllUsers(50, 0)
      .then((data) => {
        setUsers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setError("You are not authorized to view this page or failed to load users.");
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 w-48 rounded mb-6"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Access Restrained</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="h-7 w-7 text-indigo-600" /> Users Directory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and view registered accounts inside the NutriVerse application.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-5 w-5" />
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 pl-10 pr-4 py-2.5 rounded-xl shadow-sm outline-none focus:border-indigo-600 dark:focus:border-indigo-400 text-gray-900 dark:text-white transition"
          />
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                {filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {user.fullname}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" /> {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" /> {user.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            No matching users found.
          </div>
        )}
      </div>
    </div>
  );
};
