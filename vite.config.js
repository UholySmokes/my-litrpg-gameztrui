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
      {
        name: "dev-narrative-api",
        configureServer(server) {
          server.middlewares.use("/api/narrative", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Method not allowed" }));
              return;
            }

            const chunks = [];
            try {
              for await (const chunk of req) {
                chunks.push(
                  Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                );
              }
              const raw = Buffer.concat(chunks).toString("utf8");
              const body = raw ? JSON.parse(raw) : {};
              const prompt = body?.prompt;

              const apiKey =
                process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error:
                      "OpenAI API key not configured. Set OPENAI_API_KEY in your environment.",
                  }),
                );
                return;
              }

              const { default: handler } = await import("./api/narrative.js");
              req.body = { prompt };
              await handler(req, res);
            } catch (error) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Dev narrative handler failed.",
                  detail: String(error?.message || error || "Unknown error"),
                }),
              );
            }
          });
        },
      },
    ],
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
