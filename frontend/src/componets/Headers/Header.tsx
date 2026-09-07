import { useState } from 'react'
// import {useSelector} from 'react-redux'
import {NavLink} from "react-router-dom";
import ToggleButton from '../Buttons/ThemeButton';
import NotificationIcon from '../Buttons/NotifcationIconButton';
import { useAppSelector } from '../../types/ThemeHookType';
import Tooltip from '../ToolTip/TootTip';
// import Tooltip from '../ToolTip/ToolTip';
import { logoutUser } from '../../services/logoutUser';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notificationService";
import { useAuth } from "../../hooks/useAuth";
import { Trash2 } from "lucide-react";

export default function Headers() {
    const [open, setOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const mode = useAppSelector((state)=>state.theme.mode)
    const queryClient = useQueryClient();
    const { data: user } = useAuth();

    const { data: notifications = [] } = useQuery({
      queryKey: ["notifications"],
      queryFn: () => notificationService.getNotifications(),
      refetchInterval: 5000,
      enabled: !!user
    });

    const { data: unreadCount = 0 } = useQuery({
      queryKey: ["notificationUnreadCount"],
      queryFn: () => notificationService.getUnreadCount(),
      refetchInterval: 5500,
      enabled: !!user
    });

    const markAsReadMutation = useMutation({
      mutationFn: (id: string) => notificationService.markAsRead(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
      }
    });

    const markAllAsReadMutation = useMutation({
      mutationFn: () => notificationService.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
      }
    });

    const deleteNotificationMutation = useMutation({
      mutationFn: (id: string) => notificationService.deleteNotification(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notificationUnreadCount"] });
      }
    });

    const onLogout=async()=>{
        console.log("logout clicked")
        localStorage.removeItem("nutriverse_ai_chat_history");
        await logoutUser();
        window.location.replace("/auth/signin");
    }

  return (
     <header
  className="fixed top-0 left-0 right-0 z-50
             bg-white dark:bg-gray-800 shadow-sm"
>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between h-16 items-center">

          {/* Logo / Brand */}
          <div className="flex items-center space-x-2">
            <div className="bg-amber-500 text-white p-2 rounded-lg font-bold text-lg flex items-center justify-center w-9 h-9">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              NutriVerse
            </span>
          </div>

          {/* Desktop nav */} 
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-amber-600 font-semibold dark:text-amber-400": "text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400"}`}
            >
              Home
            </NavLink>

            <NavLink
              to="/recipes"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-amber-600 font-semibold dark:text-amber-400": "text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400"}`}
            >
              Recipes
            </NavLink>

            <NavLink
              to="/grocery"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-amber-600 font-semibold dark:text-amber-400": "text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400"}`}
            >
              Grocery List
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-amber-600 font-semibold dark:text-amber-400": "text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400"}`}
            >
              AI Assistant
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-amber-600 font-semibold dark:text-amber-400": "text-gray-600 hover:text-amber-500 dark:text-gray-300 dark:hover:text-amber-400"}`}
            >
              Profile
            </NavLink>

            <button
              onClick={onLogout}
              className="ml-3 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
            >
              Logout
            </button>

            <Tooltip position='bottom' content={mode==="dark"?"Enable light mode":"Enable dark mode"}>
                <ToggleButton/>
            </Tooltip>

            <div className="relative">
              <Tooltip content="view all notifications" position='bottom'>
                  <NotificationIcon count={unreadCount} onClick={() => setNotificationsOpen(!notificationsOpen)} />
              </Tooltip>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-4 space-y-3 z-50">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markAllAsReadMutation.mutate();
                        }}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                        You're all caught up 🎉
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n._id}
                          onClick={() => {
                            if (!n.isRead) markAsReadMutation.mutate(n._id);
                          }}
                          className={`flex justify-between items-start gap-2 p-2 rounded-xl text-left transition cursor-pointer ${
                            n.isRead ? "opacity-70 bg-transparent" : "bg-amber-50/40 dark:bg-zinc-800/40 border border-amber-100/30"
                          }`}
                        >
                          <div className="flex gap-2 items-start text-xs">
                            <span className="mt-0.5 shrink-0">
                              {n.type === "Recipe Created" ? "🍽️" :
                               n.type === "Recipe Updated" ? "📝" :
                               n.type === "Recipe Deleted" ? "🗑️" :
                               n.type === "Meal Plan Ready" ? "📅" :
                               n.type === "Grocery List Ready" ? "🛒" : "🔔"}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-zinc-800 dark:text-zinc-200">{n.title}</p>
                                {!n.isRead && (
                                  <span className="h-1.5 w-1.5 bg-amber-500 rounded-full shrink-0 animate-ping" />
                                )}
                              </div>
                              <p className="text-zinc-500 dark:text-zinc-400 mt-0.5 text-[11px] leading-snug">{n.message}</p>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(n._id);
                            }}
                            className="p-1 text-zinc-400 hover:text-red-500 rounded transition cursor-pointer shrink-0"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Home
            </NavLink>

            <NavLink
              to="/recipes"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Recipes
            </NavLink>

            <NavLink
              to="/grocery"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Grocery List
            </NavLink>

            <NavLink
              to="/chat"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              AI Assistant
            </NavLink>

            <NavLink
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Profile
            </NavLink>

            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
            >
              Logout
            </button>
            <ToggleButton/>
          </div>
                
        </div>
      )}

    </header>
  )
}