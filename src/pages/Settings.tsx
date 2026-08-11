import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import { AI_MODELS } from "../ai/models";
import { Download, Trash2, Check, DownloadCloud } from "lucide-react";
import { useAI } from "../hooks/useAI";
import React, { useState } from "react";
import { Recipe } from "../types/recipe";

export default function Settings() {
  const settings = useLiveQuery(() => db.settings.get("user-settings"));
  const { modelStatus, unloadModel } = useAI();
  const [exporting, setExporting] = useState(false);

  const handleModelSelect = async (modelId: string) => {
    if (modelStatus === "ready") {
       await unloadModel();
    }
    await db.settings.update("user-settings", { activeModelId: modelId });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const recipes = await db.recipes.toArray();
      const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cookmate_recipes.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const recipes = JSON.parse(text) as Recipe[];
        if (Array.isArray(recipes)) {
          await db.recipes.bulkPut(recipes);
          alert(`Successfully imported ${recipes.length} recipes.`);
        }
      } catch (err) {
        alert("Failed to parse recipe JSON file.");
      }
    };
    reader.readAsText(file);
  };

  if (!settings) return <div className="p-8 text-[#1A1A1A]/50 font-sans uppercase text-xs tracking-widest">Loading Settings...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="border-b border-[#1A1A1A]/10 pb-6">
        <h1 className="text-5xl leading-none font-black tracking-tighter italic mb-4">Configuration.</h1>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#D4A373]">System preferences & local models</p>
      </header>

      {/* AI Model Management */}
      <section>
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] mb-6 border-b border-[#1A1A1A] pb-1 inline-block">Model Parameters</h2>
        <div className="space-y-4">
          {AI_MODELS.map(model => (
            <div 
              key={model.id}
              className={`p-6 border transition-colors ${
                settings.activeModelId === model.id 
                  ? 'border-[#1A1A1A] bg-[#1A1A1A] text-[#F9F7F2]' 
                  : 'border-[#1A1A1A]/10 bg-transparent text-[#1A1A1A]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif text-2xl font-black italic tracking-tighter flex items-center gap-4">
                    {model.name}
                    {settings.activeModelId === model.id && (
                      <span className="font-sans text-[9px] uppercase tracking-widest text-[#D4A373] border border-[#D4A373] px-2 py-0.5">
                        Active Layer
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm mt-2 font-sans ${settings.activeModelId === model.id ? 'text-[#F9F7F2]/80' : 'text-[#1A1A1A]/60'}`}>
                    {model.description}
                  </p>
                  <p className={`text-xs mt-2 font-sans uppercase tracking-widest ${settings.activeModelId === model.id ? 'text-[#D4A373]' : 'text-[#1A1A1A]/40'}`}>
                    Size: {model.sizeEstimate}
                  </p>
                </div>
                
                {settings.activeModelId !== model.id ? (
                  <button 
                    onClick={() => handleModelSelect(model.id)}
                    className="px-4 py-2 border border-[#1A1A1A]/20 font-sans text-[10px] uppercase tracking-widest hover:border-[#1A1A1A] transition-colors"
                  >
                    Select
                  </button>
                ) : (
                  <div className="flex gap-2">
                    {modelStatus === "ready" && (
                       <button onClick={unloadModel} className="p-2 text-[#D4A373] hover:text-[#F9F7F2] transition-colors" title="Purge Memory">
                         <Trash2 size={18} strokeWidth={1.5} />
                       </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#1A1A1A]/40 mt-4 font-sans uppercase tracking-wider">
          Note: Weights are cached in IndexedDB. Fully local execution.
        </p>
      </section>

      {/* Data Management */}
      <section>
        <h2 className="font-sans text-xs uppercase tracking-[0.2em] mb-6 border-b border-[#1A1A1A] pb-1 inline-block">System Configuration</h2>
        <div className="flex flex-col gap-4 mb-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-[#1A1A1A]" 
              checked={!!settings.debugMode}
              onChange={async (e) => {
                await db.settings.update("user-settings", { debugMode: e.target.checked });
              }}
            />
            <span className="font-sans text-xs uppercase tracking-widest text-[#1A1A1A]">Enable Developer Debug Mode</span>
          </label>
        </div>

        <h2 className="font-sans text-xs uppercase tracking-[0.2em] mb-6 border-b border-[#1A1A1A] pb-1 inline-block">Data Layer</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-3 px-6 py-4 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] font-sans text-[10px] uppercase tracking-widest transition-colors"
          >
            <DownloadCloud size={16} strokeWidth={1.5} />
            Export Archive
          </button>
          
          <label className="flex items-center justify-center gap-3 px-6 py-4 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] font-sans text-[10px] uppercase tracking-widest transition-colors cursor-pointer">
            <Download size={16} strokeWidth={1.5} className="rotate-180" />
            Import Archive
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleImport} 
            />
          </label>
        </div>
      </section>

    </div>
  );
}
