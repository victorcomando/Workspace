import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_PORT || 5001);
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:5000";
  const host = env.VITE_HOST || "0.0.0.0";

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: true,
      host,
      proxy: {
        "/api": {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
