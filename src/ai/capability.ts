export const CapabilityManager = {
  isWebGPUAvailable(): boolean {
    return "gpu" in navigator;
  }
};
