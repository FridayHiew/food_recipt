import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect, useState } from "react";
import { initializeDb } from "../db/database";

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDb().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse text-slate-500">Initializing CookMate...</div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
