import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (typeof process.env[key] === "undefined") {
      process.env[key] = value;
    }
  }

  return {
    base: "/",
    plugins: [
      react({
        include: ["**/*.jsx", "**/*.js"],
      }),
    ],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:7071",
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, "/");
            if (!normalizedId.includes("/node_modules/")) return undefined;

            if (
              normalizedId.includes("/react/") ||
              normalizedId.includes("/react-dom/")
            ) {
              return "vendor-react";
            }

            return "vendor";
          },
        },
      },
    },
  };
});
