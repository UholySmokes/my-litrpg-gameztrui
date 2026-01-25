import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Basis-Pfad für deine Root-Domain (void-verse.com)
  base: "/",
  plugins: [
    react({
      include: ["**/*.jsx", "**/*.js"],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Pfadtrennzeichen auf Windows/Linux vereinheitlichen
          const normalizedId = id.replace(/\\/g, "/");

          if (normalizedId.includes("/node_modules/")) {
            if (
              normalizedId.includes("/react/") ||
              normalizedId.includes("/react-dom/")
            ) {
              return "vendor-react";
            }
            return "vendor";
          }

          return undefined;
        },
      },
    },
  },
});
