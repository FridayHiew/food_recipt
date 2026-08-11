import { NavLink } from "react-router-dom";
import { Home, Book, Heart, Sparkles, Settings } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/recipes", icon: Book, label: "Recipes" },
  { to: "/favorites", icon: Heart, label: "Favorites" },
  { to: "/ai", icon: Sparkles, label: "Ask" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  return (
    <nav className="flex justify-around items-center px-4 pb-safe pt-4 font-sans uppercase tracking-[0.2em] text-[9px]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center gap-1.5 p-2 transition-colors",
              isActive
                ? "text-[#1A1A1A] font-bold"
                : "text-[#1A1A1A]/40"
            )
          }
        >
          <item.icon size={20} strokeWidth={1.5} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
