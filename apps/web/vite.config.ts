import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_PORT || 5001);
  const apiBaseUrl = env.VITE_API_BASE_URL || "http://localhost:5000";
  const host = env.VITE_HOST || "0.0.0.0";

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("react-router-dom")) {
              return "router";
            }
            if (id.includes("@coreui/")) {
              return "coreui";
            }
            if (id.includes("react-big-calendar") || id.includes("date-fns")) {
              return "calendar";
            }
            if (id.includes("react-quill") || id.includes("quill")) {
              return "editor";
            }
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
          },
        },
      },
    },
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
