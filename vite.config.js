import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split("\\").join("/");

          if (normalizedId.includes("/node_modules/")) {
            if (
              normalizedId.includes("/react/") ||
              normalizedId.includes("/react-dom/")
            ) {
              return "vendor-react";
            }
            return "vendor";
          }

          if (normalizedId.includes("/src/data/registries/")) {
            return "data-registries";
          }

          if (normalizedId.includes("/src/data/")) {
            return "data";
          }

          if (normalizedId.includes("/src/systems/")) {
            return "systems";
          }

          if (normalizedId.includes("/src/core/")) {
            return "core";
          }

          return undefined;
        },
      },
    },
  },
});
