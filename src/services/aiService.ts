import { AI_PROMPTS } from "../ai/models";
import { recipeSearchSchema, RecipeSearchOutput } from "../ai/schemas";

class AIServiceClass {
  private worker: Worker | null = null;
  private messageIdCounter = 0;
  private pendingResolvers: Map<number, { resolve: Function, reject: Function }> = new Map();
  private initPromise: Promise<void> | null = null;
  private currentProgressCallback: ((text: string, progress: number) => void) | null = null;
  private currentStreamCallback: ((chunk: string) => void) | null = null;
  private jsonResolver: ((result: string) => void) | null = null;
  private jsonRejector: ((err: any) => void) | null = null;
  private streamDoneResolver: (() => void) | null = null;
  private currentModelWebLlmId: string | null = null;
  private debugListeners: Set<(msg: string) => void> = new Set();

  addDebugListener(cb: (msg: string) => void) {
    this.debugListeners.add(cb);
  }

  removeDebugListener(cb: (msg: string) => void) {
    this.debugListeners.delete(cb);
  }

  private logDebug(msg: string) {
    console.log(`[AIService] ${msg}`);
    this.debugListeners.forEach(cb => cb(msg));
  }

  private getWorker() {
    if (!this.worker) {
      this.logDebug("Initializing Web Worker for MLC Web-LLM...");
      this.worker = new Worker(new URL("../ai/llm.worker.ts", import.meta.url), { type: "module" });
      this.worker.addEventListener("message", this.handleMessage.bind(this));
    }
    return this.worker;
  }

  private handleMessage(e: MessageEvent) {
    const { type, payload } = e.data;
    switch (type) {
      case "PROGRESS":
        this.logDebug(`Download Progress: ${payload.text} (${Math.round(payload.progress * 100)}%)`);
        if (this.currentProgressCallback) {
          this.currentProgressCallback(payload.text, payload.progress);
        }
        break;
      case "INIT_DONE":
        this.logDebug(`MLC Engine successfully initialized.`);
        if (this.pendingResolvers.has(-1)) {
          this.pendingResolvers.get(-1)?.resolve();
          this.pendingResolvers.delete(-1);
        }
        break;
      case "GENERATE_JSON_DONE":
        this.logDebug(`JSON Generation complete. Bytes received: ${payload.result?.length || 0}`);
        if (this.jsonResolver) {
          this.jsonResolver(payload.result);
          this.jsonResolver = null;
          this.jsonRejector = null;
        }
        break;
      case "GENERATION_CHUNK":
        if (this.currentStreamCallback) {
          this.currentStreamCallback(payload.chunk);
        }
        break;
      case "GENERATION_DONE":
        this.logDebug(`Text stream generation finished successfully.`);
        if (this.streamDoneResolver) {
          this.streamDoneResolver();
          this.streamDoneResolver = null;
        }
        break;
      case "UNLOAD_DONE":
        this.logDebug(`Weights unloaded and model cache cleared.`);
        if (this.pendingResolvers.has(-2)) {
          this.pendingResolvers.get(-2)?.resolve();
          this.pendingResolvers.delete(-2);
        }
        break;
      case "ERROR":
        this.logDebug(`Worker ERROR: ${payload.error}`);
        if (this.jsonRejector) {
           this.jsonRejector(new Error(payload.error));
           this.jsonResolver = null;
           this.jsonRejector = null;
        }
        if (this.pendingResolvers.has(-1)) {
          this.pendingResolvers.get(-1)?.reject(new Error(payload.error));
          this.pendingResolvers.delete(-1);
        }
        break;
    }
  }

  async loadModel(webllmModel: string, onProgress: (text: string, progress: number) => void) {
    this.currentProgressCallback = onProgress;
    const worker = this.getWorker();
    
    this.logDebug(`Requesting weights download for "${webllmModel}"...`);
    const startTime = performance.now();
    return new Promise<void>((resolve, reject) => {
      this.pendingResolvers.set(-1, { resolve, reject });
      worker.postMessage({ type: "INIT", payload: { webllmModel } });
    }).then(() => {
      this.currentModelWebLlmId = webllmModel;
      this.logDebug(`Model load request succeeded in ${Math.round(performance.now() - startTime)}ms.`);
    });
  }

  async unloadModel() {
     const worker = this.getWorker();
     this.logDebug(`Requesting unload for current model weights.`);
     return new Promise<void>((resolve, reject) => {
        this.pendingResolvers.set(-2, { resolve, reject });
        worker.postMessage({ type: "UNLOAD" });
     }).then(() => {
        this.currentModelWebLlmId = null;
     });
  }

  isModelLoaded(webllmModel: string) {
     return this.currentModelWebLlmId === webllmModel;
  }

  private fallbackHeuristicExtract(prompt: string): RecipeSearchOutput {
    this.logDebug("Running fallback rule-based heuristic extractor...");
    const lowerPrompt = prompt.toLowerCase();
    
    // List of common culinary ingredients to detect
    const commonIngredients = [
      "chicken", "beef", "pork", "fish", "salmon", "shrimp", "tofu", "egg", "eggs",
      "potato", "potatoes", "tomato", "tomatoes", "onion", "onions", "garlic", "carrot", "carrots",
      "spinach", "broccoli", "rice", "pasta", "noodles", "cheese", "milk", "butter",
      "mushroom", "mushrooms", "pepper", "peppers", "lemon", "avocado", "bean", "beans",
      "steak", "lamb", "cabbage", "cucumber", "cilantro", "basil", "ginger", "soy sauce"
    ];

    const foundIngredients: string[] = [];
    commonIngredients.forEach(ing => {
      // Matches word boundaries
      const regex = new RegExp(`\\b${ing}\\b`, 'i');
      if (regex.test(lowerPrompt)) {
        // Normalize pluralization slightly
        const normalized = ing === "potatoes" ? "potato" :
                           ing === "tomatoes" ? "tomato" :
                           ing === "carrots" ? "carrot" :
                           ing === "onions" ? "onion" :
                           ing === "mushrooms" ? "mushroom" :
                           ing === "peppers" ? "pepper" :
                           ing === "eggs" ? "egg" :
                           ing === "beans" ? "bean" : ing;
        if (!foundIngredients.includes(normalized)) {
          foundIngredients.push(normalized);
        }
      }
    });

    // Handle negative/excluded terms (e.g. "no tomato", "without onion", "exclude pepper")
    const excludeList: string[] = [];
    const excludePatterns = [
      /no\s+(\w+)/gi,
      /without\s+(\w+)/gi,
      /exclude\s+(\w+)/gi,
      /avoid\s+(\w+)/gi
    ];
    excludePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(lowerPrompt)) !== null) {
        if (match[1]) {
          excludeList.push(match[1]);
        }
      }
    });

    // Filter ingredients that are on the excluded list
    const finalIngredients = foundIngredients.filter(ing => !excludeList.includes(ing));

    // Guess cuisine
    let cuisine: string | null = null;
    const cuisines = ["italian", "mexican", "asian", "chinese", "japanese", "indian", "french", "thai", "greek"];
    for (const c of cuisines) {
      if (lowerPrompt.includes(c)) {
        cuisine = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    // Guess difficulty
    let difficulty: string | null = null;
    if (lowerPrompt.includes("easy") || lowerPrompt.includes("quick") || lowerPrompt.includes("simple")) {
      difficulty = "Easy";
    } else if (lowerPrompt.includes("hard") || lowerPrompt.includes("complex") || lowerPrompt.includes("difficult") || lowerPrompt.includes("expert")) {
      difficulty = "Hard";
    } else if (lowerPrompt.includes("medium") || lowerPrompt.includes("intermediate")) {
      difficulty = "Medium";
    }

    // Guess max_time (e.g. "under 30 mins", "30 minutes")
    let max_time: number | null = null;
    const timeMatch = lowerPrompt.match(/(\d+)\s*(min|minute|hr|hour)/);
    if (timeMatch && timeMatch[1]) {
      const num = parseInt(timeMatch[1], 10);
      const isHour = timeMatch[2].startsWith("hr") || timeMatch[2].startsWith("hour");
      max_time = isHour ? num * 60 : num;
    }

    const output: RecipeSearchOutput = {
      intent: finalIngredients.length > 0 ? "find_by_ingredient" : "find_recipe",
      ingredients: finalIngredients,
      exclude: excludeList,
      max_time,
      difficulty,
      cuisine,
      dietary_requirements: []
    };

    this.logDebug(`Heuristic Extraction output: ${JSON.stringify(output)}`);
    return output;
  }

  async extractSearchIntent(prompt: string): Promise<RecipeSearchOutput> {
    const worker = this.getWorker();
    
    this.logDebug(`Extracting search intent for prompt: "${prompt}"`);
    const startTime = performance.now();

    // 12-second timeout guard to ensure user is NEVER stuck waiting for slow models
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI intent extraction timed out (12s limit).")), 12000);
    });
    
    try {
      const rawJson = await Promise.race([
        new Promise<string>((resolve, reject) => {
          this.jsonResolver = resolve;
          this.jsonRejector = reject;
          worker.postMessage({ 
            type: "GENERATE_JSON", 
            payload: { 
              prompt, 
              systemPrompt: AI_PROMPTS.searchSystemPrompt 
            } 
          });
        }),
        timeoutPromise
      ]);

      this.logDebug(`Raw JSON output generated in ${Math.round(performance.now() - startTime)}ms.`);
      
      // Robust JSON extraction & cleanup
      const extractAndParseJSON = (text: string): any => {
        const trimmed = text.trim();
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          // Attempt extraction from markdown blocks or generic brackets
          const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (innerErr) {
              // Clean up trailing commas inside arrays or objects before final attempt
              const cleaned = jsonMatch[0]
                .replace(/,\s*([\]}])/g, '$1')
                .replace(/,\s*$/g, '');
              try {
                return JSON.parse(cleaned);
              } catch (finalErr) {
                throw new Error(`Failed to clean and parse JSON match: ${innerErr}`);
              }
            }
          }
          throw e;
        }
      };

      const parsed = extractAndParseJSON(rawJson);
      const validated = recipeSearchSchema.parse(parsed);
      this.logDebug(`Intent validation succeeded: ${JSON.stringify(validated)}`);
      return validated;
    } catch (err: any) {
      this.logDebug(`AI search intent extraction failed or timed out: ${err.message || err}.`);
      
      // Reset state resolvers to prevent cross-request leaks
      this.jsonResolver = null;
      this.jsonRejector = null;
      
      // Clean fallback using heuristics
      return this.fallbackHeuristicExtract(prompt);
    }
  }

  async generateAssistantStream(
    prompt: string, 
    context: string, 
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const worker = this.getWorker();
    this.currentStreamCallback = onChunk;

    return new Promise<void>((resolve, reject) => {
      this.streamDoneResolver = resolve;
      // using jsonRejector slot just for error handling during generation
      this.jsonRejector = reject; 
      worker.postMessage({
        type: "GENERATE_STREAM",
        payload: {
           prompt,
           context,
           systemPrompt: AI_PROMPTS.assistantSystemPrompt
        }
      });
    });
  }
}

export const AIService = new AIServiceClass();
