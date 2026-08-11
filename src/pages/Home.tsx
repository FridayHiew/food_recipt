import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { Recipe } from "../types/recipe";
import { RecipeService } from "../services/recipeService";
import RecipeCard from "../components/RecipeCard";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Get recent/all recipes
    RecipeService.getAllRecipes().then(data => setRecipes(data.slice(0, 4)));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recipes?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = ["Chicken", "Beef", "Noodles", "Vegetables", "Seafood", "Dessert"];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="space-y-2">
        <span className="font-sans text-[10px] uppercase tracking-widest text-[#D4A373] block mb-2 italic">Issue No. 01 — Culinary Search</span>
        <h1 className="text-5xl md:text-6xl leading-[0.9] font-black tracking-tighter mb-6 italic">What do you <br/>want to cook?</h1>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#1A1A1A]" size={20} />
        <input
          type="text"
          placeholder="Search recipes, ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-4 bg-transparent border-b border-[#1A1A1A]/20 text-xl font-serif focus:outline-none focus:border-[#1A1A1A] placeholder:text-[#1A1A1A]/40 transition-colors"
        />
      </form>

      {/* Ask AI Banner */}
      <Link 
        to="/ai"
        className="block bg-[#1A1A1A] p-8 text-[#F9F7F2] hover:bg-[#D4A373] transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className="border border-[#F9F7F2]/20 p-3">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter mb-2">Ask CookMate.</h2>
            <p className="text-[#F9F7F2]/80 font-sans text-xs uppercase tracking-wider leading-relaxed">"I have chicken and potato.<br/>Something quick."</p>
          </div>
        </div>
      </Link>

      {/* Categories */}
      <section>
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] mb-6 border-b border-[#1A1A1A] pb-1 inline-block">Categories</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/recipes?category=${cat}`}
              className="px-4 py-2 border border-[#1A1A1A]/10 text-xs font-sans uppercase tracking-widest hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section>
        <div className="flex items-end justify-between mb-6 border-b border-[#1A1A1A] pb-2">
          <h2 className="font-sans text-xs uppercase tracking-[0.2em]">Recent Recipes</h2>
          <Link to="/recipes" className="font-sans text-[10px] uppercase tracking-widest text-[#D4A373] hover:text-[#1A1A1A] transition-colors">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {recipes.map(recipe => (
             <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    </div>
  );
}
