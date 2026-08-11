export type ModelStatus =
  | "not_installed"
  | "downloading"
  | "loading"
  | "ready"
  | "error";

export interface AIModelConfig {
  id: string;
  name: string;
  description: string;
  webllmModel: string; // The exact model string for @mlc-ai/web-llm
  recommended?: boolean;
  sizeEstimate?: string;
}

export type AIIntent =
  | "find_recipe"
  | "find_by_ingredient"
  | "find_by_time"
  | "find_by_cuisine"
  | "find_by_diet"
  | "scale_recipe"
  | "substitute_ingredient"
  | "explain_recipe";

export interface AIWorkerMessage {
  type: string;
  payload?: any;
}
