"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Utensils,
  Moon,
  MessageSquare,
  Calendar,
  Receipt,
  Settings,
  Baby,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Enfants", href: "/enfants", icon: Baby },
  { name: "Pointage", href: "/pointage", icon: ClipboardCheck },
  { name: "Journal", href: "/journal", icon: Utensils },
  { name: "Transmissions", href: "/transmissions", icon: MessageSquare },
  { name: "Planning", href: "/planning", icon: Calendar },
  { name: "Equipe", href: "/equipe", icon: Users },
  { name: "Facturation", href: "/facturation", icon: Receipt },
  { name: "Parametres", href: "/parametres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="font-semibold text-sm">La Souris Verte</p>
          <p className="text-xs text-indigo-100 mt-1">Micro-creche</p>
          <p className="text-xs text-indigo-100">12 enfants inscrits</p>
        </div>
      </div>
    </aside>
  );
}
