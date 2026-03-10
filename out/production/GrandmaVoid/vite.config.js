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
          target: "http://localhost:5000",
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
            const cleanId = normalizedId.split("?")[0];

            // Vendor chunking (node_modules)
            if (cleanId.includes("/node_modules/")) {
              if (
                cleanId.includes("/react/") ||
                cleanId.includes("/react-dom/")
              ) {
                return "vendor-react";
              }

              return "vendor";
            }

            // App chunking: split the biggest game-core registries/systems so the
            // lazy-loaded GameUI chunk stays under the warning limit.
            if (cleanId.includes("/packages/game-core/")) {
              if (
                cleanId.endsWith("/systems/archetype/ArchetypeSystemRegistry.js")
              ) {
                return "game-core-archetypes";
              }

              if (cleanId.includes("/systems/skills/")) {
                return "game-core-skills";
              }

              if (cleanId.endsWith("/world/WorldDataRegistry.js")) {
                return "game-core-world-data";
              }
            }

            return undefined;
          },
        },
      },
    },
  };
});
