export const CapabilityManager = {
  async isWebGPUAvailable(): Promise<boolean> {
    if (!("gpu" in navigator)) return false;
    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter();
      if (!adapter) return false;
      return true;
    } catch (e) {
      console.warn("WebGPU adapter request failed:", e);
      return false;
    }
  },
  async getGPUInfo(): Promise<string> {
    if (!("gpu" in navigator)) return "WebGPU not supported in navigator";
    try {
      const gpu = (navigator as any).gpu;
      const adapter = await gpu.requestAdapter();
      if (!adapter) return "WebGPU adapter is null (unsupported)";
      const info = await (adapter as any).requestAdapterInfo();
      return `${info.vendor || "Unknown Vendor"} - ${info.architecture || "Unknown Architecture"} (${info.description || "No description"})`;
    } catch (e: any) {
      return `Failed to request GPU info: ${e.message || e}`;
    }
  }
};
