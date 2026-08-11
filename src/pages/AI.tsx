import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle, Play, Download, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { useAI } from "../hooks/useAI";
import { AIService } from "../services/aiService";
import { SearchService } from "../services/searchService";
import { Recipe } from "../types/recipe";
import RecipeCard from "../components/RecipeCard";

export default function AI() {
  const { isGpuAvailable, modelStatus, progressText, progressValue, loadModel, unloadModel, activeModelConfig } = useAI();
  const [messages, setMessages] = useState<{ role: "user" | "ai", text: string, type: "text" | "recipes", recipes?: Recipe[] }[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || modelStatus !== "ready") return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage, type: "text" }]);
    setIsProcessing(true);

    try {
      // For MVP, we primarily use it for Recipe Search Intent
      const intent = await AIService.extractSearchIntent(userMessage);
      
      const results = await SearchService.searchRecipes({
        ingredients: intent.ingredients,
        exclude: intent.exclude,
        maxTime: intent.max_time,
        difficulty: intent.difficulty || undefined,
        cuisine: intent.cuisine || undefined
      });

      if (results.length > 0) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: `I found ${results.length} recipe(s) based on your request.`,
          type: "recipes",
          recipes: results.slice(0, 3) 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: "I couldn't find any recipes exactly matching that in your database. Try asking for something else or with fewer restrictions.",
          type: "text" 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I had trouble processing that request.", type: "text" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isGpuAvailable) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-serif">
        <AlertCircle size={48} className="text-[#1A1A1A]/40 mb-4" />
        <h2 className="text-3xl font-black italic tracking-tighter mb-2 text-[#1A1A1A]">Engine Unavailable.</h2>
        <p className="text-[#1A1A1A]/60 max-w-md font-sans">
          Your browser or device does not support WebGPU, which is required to run the local AI model.
          You can still use the normal recipe search.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] max-w-3xl mx-auto border-x border-[#1A1A1A]/10">
      {/* Header & Status */}
      <div className="bg-[#F9F7F2] p-6 border-b border-[#1A1A1A]/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-[#1A1A1A]">
            Latent Gastronomy.
          </h1>
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#D4A373] italic">Powered by {activeModelConfig.name}</p>
        </div>
        
        {/* Model Controls */}
        <div className="flex items-center gap-2 font-sans uppercase tracking-widest text-[9px]">
          {modelStatus === "not_installed" && (
            <button onClick={loadModel} className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-[#F9F7F2] hover:bg-[#D4A373] transition-colors border border-[#1A1A1A]">
              <Download size={14} /> Load Weights
            </button>
          )}
          {modelStatus === "downloading" && (
             <div className="flex items-center gap-2 text-[#D4A373] font-bold px-4 py-2 border border-[#D4A373]">
                <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                Acquiring ({Math.round(progressValue)}%)
             </div>
          )}
          {modelStatus === "loading" && (
             <div className="flex items-center gap-2 text-[#D4A373] font-bold">
               Initializing Tensor Core...
             </div>
          )}
          {modelStatus === "ready" && (
             <div className="flex items-center gap-2 px-4 py-2 text-[#1A1A1A] font-bold border border-[#1A1A1A]/20">
               <CheckCircle2 size={14} /> Engine Ready
               <button onClick={unloadModel} className="ml-4 text-[#1A1A1A]/40 hover:text-[#1A1A1A]" title="Unload Model">
                 <Trash2 size={14} />
               </button>
             </div>
          )}
          {modelStatus === "error" && (
             <div className="flex items-center gap-2 px-4 py-2 text-[#1A1A1A] font-bold border border-red-500/20 bg-red-500/10">
               <AlertCircle size={14} className="text-red-500" /> Error Loading Engine
               <button onClick={loadModel} className="ml-4 text-[#1A1A1A]/60 hover:text-[#1A1A1A]" title="Retry">
                 Retry
               </button>
             </div>
          )}
        </div>
      </div>

      {(modelStatus === "downloading" || modelStatus === "error") && progressText && (
        <div className="bg-[#1A1A1A] px-6 py-2 text-[10px] font-sans text-[#F9F7F2]/60 border-b border-[#1A1A1A]">
           {progressText}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-[#F9F7F2] to-[#F9F7F2] bg-white/0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-16 h-16 border border-[#1A1A1A]/20 flex items-center justify-center rounded-full">
              <Bot size={24} className="text-[#1A1A1A]/40" />
            </div>
            <p className="font-sans text-sm text-[#1A1A1A]/60 max-w-sm leading-relaxed">Present your ingredients or culinary desires. The engine will synthesize a suitable methodology.</p>
            <div className="flex flex-col gap-3 max-w-md w-full">
              {["I have chicken and potato", "Something quick and spicy", "Vegetarian noodles"].map(s => (
                <button key={s} onClick={() => setInput(s)} className="px-6 py-3 border border-[#1A1A1A]/10 bg-transparent text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2] font-sans text-[10px] uppercase tracking-widest transition-colors text-left">
                  {s}.
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10 pb-4">
            {messages.map((msg, i) => (
              <div key={i} className={clsx("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#D4A373] mb-2">
                  {msg.role === "user" ? "User Input" : "Engine Output"}
                </span>
                <div className={clsx(
                  "max-w-[85%] font-serif text-lg leading-relaxed",
                  msg.role === "user" 
                    ? "text-[#1A1A1A]" 
                    : "text-[#1A1A1A]/80 italic"
                )}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                
                {msg.type === "recipes" && msg.recipes && (
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    {msg.recipes.map(r => (
                      <RecipeCard key={r.id} recipe={r} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
               <div className="flex flex-col items-start">
                 <span className="font-sans text-[9px] uppercase tracking-widest text-[#D4A373] mb-2">Engine Output</span>
                 <div className="flex items-center gap-2 py-2">
                    <div className="w-1.5 h-1.5 bg-[#1A1A1A]/40 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#1A1A1A]/40 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                    <div className="w-1.5 h-1.5 bg-[#1A1A1A]/40 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-[#1A1A1A]/10 bg-[#F9F7F2]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={modelStatus !== "ready" || isProcessing}
            placeholder={
              modelStatus === "not_installed" ? "Load model to initiate prompt..." :
              modelStatus !== "ready" ? "Model is loading..." : 
              "Input culinary request..."
            }
            className="w-full pl-0 pr-12 py-3 bg-transparent border-b border-[#1A1A1A]/20 focus:border-[#1A1A1A] font-serif text-lg focus:outline-none placeholder:text-[#1A1A1A]/30 disabled:opacity-50 transition-colors rounded-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || modelStatus !== "ready" || isProcessing}
            className="absolute right-0 bottom-3 p-2 text-[#1A1A1A] disabled:text-[#1A1A1A]/20 hover:text-[#D4A373] transition-colors"
          >
            <Send size={20} strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

function SparkleIcon() {
  return <Sparkles size={20} className="text-orange-500" />;
}
