// import React from "react";
import { Bell } from "lucide-react";

export default function NotificationIcon({
  count = 0,
  onClick = () => {},
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      className="relative p-2 rounded-full
                 text-gray-600 dark:text-gray-300
                 hover:bg-gray-100 dark:hover:bg-gray-700
                 focus:outline-none focus:ring-2 focus:ring-indigo-500
                 focus:ring-offset-2 dark:focus:ring-offset-gray-900
                 transition"
    >
      {/* Bell Icon */}
      <Bell className="h-6 w-6" />

      {/* Notification badge */}
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1
                     min-w-[18px] h-[18px]
                     px-1 text-xs font-semibold
                     flex items-center justify-center
                     rounded-full
                     bg-red-500 text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}