import { NavLink } from "react-router-dom";
import { Home, Book, Heart, Sparkles, Settings, ChefHat } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/recipes", icon: Book, label: "Recipes" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/ai", icon: Sparkles, label: "Ask CookMate" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-12 text-[#1A1A1A]">
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#D4A373] block mb-2 italic">Culinary Archive</span>
        <h1 className="text-3xl leading-none font-black tracking-tighter italic">CookMate.</h1>
      </div>

      <nav className="flex flex-col gap-6 flex-1 font-sans text-xs uppercase tracking-[0.2em]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 transition-colors",
                isActive
                  ? "font-bold text-[#1A1A1A]"
                  : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={16} strokeWidth={isActive ? 2.5 : 1.5} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-[#1A1A1A]/10 font-sans text-[9px] uppercase tracking-tighter opacity-40">
        Powered by Epicure Engine<br/>Local First LLM
      </div>
    </div>
  );
}
