"use client";

import { Baby, Bell, Menu, User } from "lucide-react";

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-2 rounded-xl">
            <Baby className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-800">MOUSSY</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700">Marie D.</span>
        </button>
      </div>
    </header>
  );
}
