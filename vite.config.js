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

            // Vendor chunking (node_modules)
            if (normalizedId.includes("/node_modules/")) {
              if (
                normalizedId.includes("/react/") ||
                normalizedId.includes("/react-dom/")
              ) {
                return "vendor-react";
              }

              return "vendor";
            }

            // App chunking: split the biggest game-core registries/systems so the
            // lazy-loaded GameUI chunk stays under the warning limit.
            if (normalizedId.includes("/packages/game-core/")) {
              if (
                normalizedId.endsWith(
                  "/systems/archetype/ArchetypeSystemRegistry.js",
                )
              ) {
                return "game-core-archetypes";
              }

              if (normalizedId.includes("/systems/skills/")) {
                return "game-core-skills";
              }

              if (normalizedId.endsWith("/world/WorldDataRegistry.js")) {
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
