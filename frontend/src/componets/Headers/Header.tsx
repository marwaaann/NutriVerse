import React,{useState} from 'react'
// import {useSelector} from 'react-redux'
import {NavLink,useNavigate} from "react-router-dom";
import ToggleButton from '../Buttons/ThemeButton';
import NotificationIcon from '../Buttons/NotifcationIconButton';
import { useAppSelector } from '../../types/ThemeHookType';
import Tooltip from '../ToolTip/TootTip';
// import Tooltip from '../ToolTip/ToolTip';
// import logoutUser from '../../services/logoutUser';
// import {useDispatch} from "react-redux";
// import { useAppDispatch } from '../types/ThemeHookType';


export default function Headers() {
    const [open, setOpen] = useState(false);
    const mode = useAppSelector((state)=>state.theme.mode)
    // const dispatch=useDispatch()
    // const navigate=useNavigate()


    const onLogout=async()=>{
        console.log("logout clicked")
        // const res=await logoutUser()
        // console.log(res)
        // dispatch(clearAccessToken())
        // dispatch(clearUser())
        // window.location.replace("/signin");

    }

  return (
     <header
  className="fixed top-0 left-0 right-0 z-50
             bg-white dark:bg-gray-800 shadow-sm"
>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between h-16 items-center">

          {/* Desktop nav */} 
          <nav className="hidden md:flex items-center space-x-6">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-indigo-600 font-semibold dark:text-indigo-400": "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"}`}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/users"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-indigo-600 font-semibold dark:text-indigo-400": "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"}`}
            >
              Users
            </NavLink>

            <NavLink
              to="/chat"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-indigo-600 font-semibold dark:text-indigo-400": "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"}`}
            >
              Chat
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>`px-2 py-1 rounded transition ${isActive? "text-indigo-600 font-semibold dark:text-indigo-400": "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"}`}
            >
              Settings
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

            <Tooltip content="view all notification" position='bottom'>
                <NotificationIcon/>
            </Tooltip>
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
              Dashboard
            </NavLink>

            <NavLink
              to="/users"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Users
            </NavLink>

            <NavLink
              to="/chat"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Chat
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              About
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