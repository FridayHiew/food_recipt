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

  async extractSearchIntent(prompt: string): Promise<RecipeSearchOutput> {
    const worker = this.getWorker();
    
    this.logDebug(`Extracting search intent for prompt: "${prompt}"`);
    const startTime = performance.now();
    const rawJson = await new Promise<string>((resolve, reject) => {
      this.jsonResolver = resolve;
      this.jsonRejector = reject;
      worker.postMessage({ 
        type: "GENERATE_JSON", 
        payload: { 
          prompt, 
          systemPrompt: AI_PROMPTS.searchSystemPrompt 
        } 
      });
    });

    this.logDebug(`Raw JSON output generated in ${Math.round(performance.now() - startTime)}ms.`);
    try {
      const parsed = JSON.parse(rawJson);
      const validated = recipeSearchSchema.parse(parsed);
      this.logDebug(`Intent validation succeeded: ${JSON.stringify(validated)}`);
      return validated;
    } catch (err: any) {
      this.logDebug(`JSON parsing/validation failed: ${err.message || err}`);
      // Fallback
      return {
        intent: "find_recipe",
        ingredients: [],
        exclude: [],
        max_time: null,
        difficulty: null,
        cuisine: null,
        dietary_requirements: []
      };
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
