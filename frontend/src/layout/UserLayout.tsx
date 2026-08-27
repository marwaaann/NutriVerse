import React, { type ReactNode } from "react";
import Headers from "../componets/Headers/Header";
import Footer from "../componets/Footer/Footer";

export default function Layout({ children }:{children:ReactNode}) {

    
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <Headers />

      {/* Main content */}
      <main className="flex-1 pt-16 px-6">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}