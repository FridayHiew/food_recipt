import { createHashRouter, Outlet } from "react-router-dom";
import Home from "../pages/Home";
import Recipes from "../pages/Recipes";
import RecipeDetail from "../pages/RecipeDetail";
import Favorites from "../pages/Favorites";
import AI from "../pages/AI";
import Settings from "../pages/Settings";
import Sidebar from "../components/Sidebar";
import BottomNav from "../components/BottomNav";

function AppLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F9F7F2] text-[#1A1A1A] font-serif overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-[#1A1A1A]/10 p-6 flex-col justify-between">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0 p-6 md:p-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#1A1A1A]/10 bg-[#F9F7F2] z-50">
        <BottomNav />
      </div>
    </div>
  );
}

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "recipes", element: <Recipes /> },
      { path: "recipes/:id", element: <RecipeDetail /> },
      { path: "favorites", element: <Favorites /> },
      { path: "ai", element: <AI /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
