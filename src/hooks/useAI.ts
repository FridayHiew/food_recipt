import { useState, useEffect } from "react";
import { AIService } from "../services/aiService";
import { CapabilityManager } from "../ai/capability";
import { db } from "../db/database";
import { AI_MODELS } from "../ai/models";
import { useLiveQuery } from "dexie-react-hooks";

export function useAI() {
  const settings = useLiveQuery(() => db.settings.get("user-settings"));
  
  const [isGpuAvailable, setIsGpuAvailable] = useState<boolean>(true);
  const [gpuInfo, setGpuInfo] = useState<string>("Checking...");
  const [modelStatus, setModelStatus] = useState<"not_installed" | "downloading" | "loading" | "ready" | "error">("not_installed");
  const [progressText, setProgressText] = useState("");
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    let active = true;
    const checkGPU = async () => {
      const available = await CapabilityManager.isWebGPUAvailable();
      const info = await CapabilityManager.getGPUInfo();
      if (active) {
        setIsGpuAvailable(available);
        setGpuInfo(info);
      }
    };
    checkGPU();
    return () => { active = false; };
  }, []);

  const getActiveModelConfig = () => {
    if (!settings?.activeModelId) return AI_MODELS[0];
    return AI_MODELS.find(m => m.id === settings.activeModelId) || AI_MODELS[0];
  };

  const loadModel = async () => {
    if (!isGpuAvailable) return;
    
    const config = getActiveModelConfig();
    if (AIService.isModelLoaded(config.webllmModel)) {
      setModelStatus("ready");
      return;
    }

    try {
      setModelStatus("loading");
      await AIService.loadModel(config.webllmModel, (text, progress) => {
        setProgressText(text);
        setProgressValue(progress * 100);
        if (progress > 0 && progress < 1) {
           setModelStatus("downloading");
        }
      });
      setModelStatus("ready");
    } catch (err: any) {
      console.warn(err);
      if (err?.message?.includes("compatible GPU") || err?.toString()?.includes("compatible GPU")) {
        setIsGpuAvailable(false);
      } else {
        setModelStatus("error");
        setProgressText(err?.message || "Failed to load model");
      }
    }
  };

  const unloadModel = async () => {
    await AIService.unloadModel();
    setModelStatus("not_installed");
  };

  return {
    isGpuAvailable,
    gpuInfo,
    modelStatus,
    progressText,
    progressValue,
    loadModel,
    unloadModel,
    activeModelConfig: getActiveModelConfig(),
    settings
  };
}
