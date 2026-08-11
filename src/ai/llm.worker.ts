import { CreateMLCEngine, MLCEngine, InitProgressReport, prebuiltAppConfig } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;
let currentModelId: string | null = null;

self.addEventListener("message", async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    if (type === "INIT") {
      const { webllmModel } = payload;
      if (engine && currentModelId === webllmModel) {
        self.postMessage({ type: "INIT_DONE" });
        return;
      }

      if (engine) {
        await engine.unload();
      }

      engine = await CreateMLCEngine(webllmModel, {
        initProgressCallback: (progress: InitProgressReport) => {
          self.postMessage({
            type: "PROGRESS",
            payload: {
              text: progress.text,
              progress: progress.progress,
            },
          });
        },
        appConfig: {
          ...prebuiltAppConfig,
          cacheBackend: "indexeddb",
        },
      });
      currentModelId = webllmModel;
      self.postMessage({ type: "INIT_DONE" });
    } else if (type === "GENERATE_JSON") {
      if (!engine) throw new Error("Engine not initialized");
      
      const { prompt, systemPrompt } = payload;
      const messages: any[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ];

      // Standard chat completion is 10x-100x faster and never freezes or gets stuck in the state machine sampler.
      const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.1, // low temp for JSON
      });

      self.postMessage({
        type: "GENERATE_JSON_DONE",
        payload: { result: reply.choices[0].message.content },
      });
    } else if (type === "GENERATE_STREAM") {
      if (!engine) throw new Error("Engine not initialized");
      
      const { prompt, systemPrompt, context } = payload;
      const messages: any[] = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      if (context) messages.push({ role: "user", content: `Context:\n${context}` });
      messages.push({ role: "user", content: prompt });

      const asyncChunkGenerator = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of asyncChunkGenerator) {
        if (chunk.choices[0].delta.content) {
           self.postMessage({
             type: "GENERATION_CHUNK",
             payload: { chunk: chunk.choices[0].delta.content }
           });
        }
      }

      self.postMessage({ type: "GENERATION_DONE" });
    } else if (type === "UNLOAD") {
      if (engine) {
        await engine.unload();
        engine = null;
        currentModelId = null;
      }
      self.postMessage({ type: "UNLOAD_DONE" });
    }
  } catch (error: any) {
    self.postMessage({ type: "ERROR", payload: { error: error.message } });
  }
});
