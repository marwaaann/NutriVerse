import { memo } from "react";
import { NavLink } from "react-router-dom";

 function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Brand / About */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              NutriVerse
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              A modern web application built with React, Tailwind CSS and
              scalable architecture. Designed for performance, usability,
              and clean user experience.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Quick Links
            </h4>

            <nav className="mt-3 flex flex-col space-y-2 text-sm">
              <NavLink
                to="/recipes"
                className="text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition"
              >
                Recipes
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200 dark:border-gray-700" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            © {year} NutriVerse. All rights reserved.
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Built with React, Tailwind CSS & modern web technologies
          </p>
        </div>

      </div>
    </footer>
  );
}

export default memo(Footer);