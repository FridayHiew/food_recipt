export interface Settings {
  id: string; // Always "user-settings"
  aiEnabled: boolean;
  activeModelId: string | null;
  theme: "light" | "dark" | "system";
  debugMode?: boolean;
}
