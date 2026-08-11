import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Recipe } from "../types/recipe";
import { Clock, Heart } from "lucide-react";
import { clsx } from "clsx";
import { RecipeService } from "../services/recipeService";

interface RecipeCardProps {
  key?: string | number;
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    RecipeService.isFavorite(recipe.id).then(setIsFav);
  }, [recipe.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = await RecipeService.toggleFavorite(recipe.id);
    setIsFav(newStatus);
  };

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Link 
      to={`/recipes/${recipe.id}`}
      className="group relative block bg-[#F9F7F2] border border-[#1A1A1A]/10 overflow-hidden hover:border-[#1A1A1A]/30 transition-colors"
    >
      {/* Placeholder image if none exists */}
      <div className="aspect-square sm:aspect-video w-full relative overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#D4A373] to-[#F9F7F2] border-b border-[#1A1A1A]/10">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
             <div className="w-32 h-32 rounded-full border border-[#1A1A1A] rotate-45"></div>
          </div>
        )}
      </div>

      <button 
        onClick={toggleFav}
        className="absolute top-4 right-4 p-2 bg-[#F9F7F2] border border-[#1A1A1A]/10 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] transition-colors z-10 rounded-full"
      >
        <Heart size={16} strokeWidth={isFav ? 2.5 : 1.5} className={clsx(isFav && "fill-current")} />
      </button>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-4 font-sans text-[9px] uppercase tracking-[0.2em]">
          <span className="text-[#D4A373] font-bold">
            {recipe.category}
          </span>
          <span className="opacity-40">/</span>
          <span className="text-[#1A1A1A] font-bold opacity-60">
            {recipe.difficulty}
          </span>
        </div>
        
        <h3 className="font-black text-2xl mb-2 text-[#1A1A1A] tracking-tighter italic leading-tight group-hover:text-[#D4A373] transition-colors">
          {recipe.name}
        </h3>
        
        <p className="text-sm text-[#1A1A1A]/70 line-clamp-2 mb-6 font-sans">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between font-sans text-[10px] uppercase tracking-wider border-t border-[#1A1A1A]/10 pt-4">
          <div className="opacity-60">
            <span>Total Time</span>
          </div>
          <div className="font-bold text-[#1A1A1A]">
            {totalTime} Mins
          </div>
        </div>
      </div>
    </Link>
  );
}
