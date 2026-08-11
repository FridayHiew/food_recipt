import { AIModelConfig } from "../types/ai";

export const AI_MODELS: AIModelConfig[] = [
  {
    id: "smollm2-135m",
    name: "SmolLM2 135M Instruct",
    description: "Ultra-compact model ideal for low-memory devices, mobile, and fast initial downloads",
    webllmModel: "SmolLM2-135M-Instruct-q0f16-MLC",
    sizeEstimate: "135MB"
  },
  {
    id: "smollm2-360m",
    name: "SmolLM2 360M Instruct",
    description: "Compact lightweight model balancing minimal resource footprint and speed",
    webllmModel: "SmolLM2-360M-Instruct-q4f16_1-MLC",
    sizeEstimate: "250MB"
  },
  {
    id: "qwen-0.5b",
    name: "Qwen 2.5 0.5B Instruct",
    description: "Lightweight model for recipe search and simple assistance",
    webllmModel: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    recommended: true,
    sizeEstimate: "500MB"
  },
  {
    id: "llama-3.2-1b",
    name: "Llama 3.2 1B Instruct",
    description: "Slightly larger model for better reasoning",
    webllmModel: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    sizeEstimate: "800MB"
  }
];

export const AI_PROMPTS = {
  searchSystemPrompt: `You are CookMate, a local AI assistant that converts user cooking requests into structured JSON.
Do not invent recipes. Do not access databases. Extract only information present or reasonably implied by the user's request.
Return JSON ONLY, matching this schema:
{
  "intent": "find_recipe" | "find_by_ingredient" | "find_by_time" | "find_by_cuisine" | "find_by_diet",
  "ingredients": string[],
  "exclude": string[],
  "max_time": number | null,
  "difficulty": string | null,
  "cuisine": string | null,
  "dietary_requirements": string[]
}
Never include extra text before or after the JSON.`,

  assistantSystemPrompt: `You are CookMate, a helpful cooking assistant.
Use the provided recipe context to answer the user's questions. 
If the user asks to substitute an ingredient, scale a recipe, or explain a step, do so based ONLY on the provided recipe context.
Keep your answers brief and practical.`,
};
