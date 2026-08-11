import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Recipe } from "../types/recipe";
import { RecipeService } from "../services/recipeService";
import { ArrowLeft, Clock, Users, Flame, Heart } from "lucide-react";
import { clsx } from "clsx";

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (id) {
      RecipeService.getRecipeById(id).then(r => {
        if (r) setRecipe(r);
      });
      RecipeService.isFavorite(id).then(setIsFav);
    }
  }, [id]);

  if (!recipe) {
    return <div className="p-8 text-center text-slate-500">Loading recipe...</div>;
  }

  const toggleFav = async () => {
    const newStatus = await RecipeService.toggleFavorite(recipe.id);
    setIsFav(newStatus);
  };

  return (
    <div className="space-y-12 pb-20 md:pb-0 animate-in slide-in-from-bottom-4 duration-300">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-widest hover:text-[#D4A373] transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Collection</span>
      </button>

      {/* Header Info */}
      <div>
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1">
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#D4A373] block mb-4 italic">
              {recipe.category} — {recipe.cuisine}
            </span>
            
            <h1 className="text-5xl md:text-7xl leading-[0.9] font-black tracking-tighter mb-6 italic">{recipe.name}.</h1>
            <p className="text-lg text-[#1A1A1A]/80 mb-8 leading-relaxed font-sans">
              {recipe.description}
            </p>

            <div className="flex space-x-8 font-sans text-[11px] uppercase tracking-wider opacity-60">
              <div>
                <span>Prep</span><br/>
                <span className="text-[#1A1A1A] font-bold">{recipe.prepTime} Mins</span>
              </div>
              <div>
                <span>Cook</span><br/>
                <span className="text-[#1A1A1A] font-bold">{recipe.cookTime} Mins</span>
              </div>
              <div>
                <span>Serves</span><br/>
                <span className="text-[#1A1A1A] font-bold">{String(recipe.servings).padStart(2, '0')} People</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-[320px] flex-shrink-0 flex flex-col gap-4">
             {recipe.image ? (
                <img src={recipe.image} alt={recipe.name} className="w-full h-64 object-cover grayscale" />
             ) : (
                <div className="w-full h-64 relative bg-gradient-to-tr from-[#D4A373] to-[#F9F7F2] border border-[#1A1A1A]/5 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                     <div className="w-48 h-48 rounded-full border border-[#1A1A1A] rotate-45"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 font-sans text-[10px] uppercase tracking-tighter text-[#1A1A1A]">
                    Fig. 1 — {recipe.category}
                  </div>
                </div>
             )}
             
             <button 
                onClick={toggleFav}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 py-4 font-sans text-[10px] uppercase tracking-widest transition-all border",
                  isFav 
                    ? "bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]" 
                    : "bg-transparent text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2]"
                )}
             >
                <Heart size={14} className={clsx(isFav && "fill-current")} />
                {isFav ? "Saved to Journal" : "Save to Journal"}
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-8 border-t border-[#1A1A1A]/10">
        {/* Ingredients */}
        <div className="md:col-span-5 h-fit">
          <h3 className="font-sans text-xs uppercase tracking-[0.2em] mb-6 border-b border-[#1A1A1A] pb-1 inline-block">
             Ingredients
          </h3>
          <ul className="font-sans text-[13px] space-y-3 leading-relaxed">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between border-b border-[#1A1A1A]/5 pb-2">
                <span className="capitalize">{ing.name}</span>
                <span className="font-bold">{ing.quantity} {ing.unit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        <div className="md:col-span-7">
           <h3 className="font-sans text-xs uppercase tracking-[0.2em] mb-6 border-b border-[#1A1A1A] pb-1 inline-block">
             The Method
           </h3>
           <div className="space-y-6 text-lg leading-snug">
             {recipe.steps.map((step, i) => (
                <p key={i}>
                  <span className="text-[#D4A373] mr-3 font-sans text-xs font-bold uppercase">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  {step}
                </p>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
