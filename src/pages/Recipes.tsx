import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Recipe } from "../types/recipe";
import { SearchService } from "../services/searchService";
import RecipeCard from "../components/RecipeCard";

export default function Recipes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState("All");
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      const results = await SearchService.searchRecipes({
        query: query,
        category: category !== "All" ? category : undefined,
        difficulty: difficulty !== "All" ? difficulty : undefined,
      });
      setRecipes(results);
      setLoading(false);
    };

    const timer = setTimeout(fetchRecipes, 300); // debounce
    return () => clearTimeout(timer);
  }, [query, category, difficulty]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="space-y-6">
        <h1 className="text-5xl leading-none font-black tracking-tighter italic">Library.</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 border-b border-[#1A1A1A]/10 pb-6">
          <div className="relative flex-1">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#1A1A1A]" size={16} />
            <input
              type="text"
              placeholder="Search library..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchParams(e.target.value ? { q: e.target.value } : {});
              }}
              className="w-full pl-8 pr-4 py-2 bg-transparent border-none text-[#1A1A1A] font-serif focus:outline-none placeholder:text-[#1A1A1A]/40"
            />
          </div>
          
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 bg-transparent border border-[#1A1A1A]/10 focus:border-[#1A1A1A] text-xs font-sans uppercase tracking-widest text-[#1A1A1A] appearance-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Chicken">Chicken</option>
            <option value="Beef">Beef</option>
            <option value="Noodles">Noodles</option>
            <option value="Vegetables">Vegetables</option>
          </select>

          <select 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-4 py-2 bg-transparent border border-[#1A1A1A]/10 focus:border-[#1A1A1A] text-xs font-sans uppercase tracking-widest text-[#1A1A1A] appearance-none cursor-pointer"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12 text-[#1A1A1A]/50 font-sans text-xs uppercase tracking-widest">Gathering recipes...</div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map(recipe => (
             <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-[#1A1A1A]/50 font-serif italic">No recipes found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
