import { useEffect, useState } from "react";
import { Recipe } from "../types/recipe";
import { RecipeService } from "../services/recipeService";
import RecipeCard from "../components/RecipeCard";

export default function Favorites() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavs = async () => {
      setLoading(true);
      const results = await RecipeService.getFavorites();
      setRecipes(results);
      setLoading(false);
    };
    fetchFavs();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="border-b border-[#1A1A1A]/10 pb-6">
        <h1 className="text-5xl leading-none font-black tracking-tighter italic mb-4">Saved Journal.</h1>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#D4A373]">Recipes you've archived for later.</p>
      </header>

      {loading ? (
        <div className="text-center py-12 text-[#1A1A1A]/50 font-sans text-xs uppercase tracking-widest">Loading archives...</div>
      ) : recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map(recipe => (
             <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-[#1A1A1A]/50 font-serif italic">You haven't archived any recipes yet.</p>
        </div>
      )}
    </div>
  );
}
