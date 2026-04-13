import http from "node:http";
import process from "node:process";
import { Buffer } from "node:buffer";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../functions/lib/api-router.js");

if (typeof process.env.DEV_AUTH_ENABLED === "undefined") {
  process.env.DEV_AUTH_ENABLED = "true";
}

const port = Number.parseInt(process.env.API_PORT || "5000", 10) || 5000;
const host = process.env.API_HOST || "127.0.0.1";

function parseBody(rawBody, headers) {
  if (!rawBody || rawBody.length === 0) return undefined;
  const contentType = String(headers?.["content-type"] || "").toLowerCase();
  if (!contentType.includes("application/json")) return undefined;
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    return undefined;
  }
}

function createResponseAdapter(nodeRes) {
  const res = {
    locals: {},
    status(code) {
      nodeRes.statusCode = code;
      return res;
    },
    set(key, value) {
      nodeRes.setHeader(key, value);
      return res;
    },
    json(body) {
      if (!nodeRes.getHeader("Content-Type")) {
        nodeRes.setHeader("Content-Type", "application/json");
      }
      if (!nodeRes.writableEnded) {
        nodeRes.end(JSON.stringify(body));
      }
      return res;
    },
    send(body = "") {
      if (nodeRes.writableEnded) return res;
      if (typeof body === "object" && body !== null && !Buffer.isBuffer(body)) {
        return res.json(body);
      }
      nodeRes.end(body);
      return res;
    },
  };

  return res;
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  const chunks = [];
  for await (const chunk of nodeReq) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
  const req = Object.assign(nodeReq, {
    originalUrl: nodeReq.url,
    rawBody,
    body: parseBody(rawBody, nodeReq.headers),
  });
  const res = createResponseAdapter(nodeRes);

  try {
    await handleApiRequest(req, res);
    if (!nodeRes.writableEnded) {
      nodeRes.statusCode = nodeRes.statusCode || 204;
      nodeRes.end("");
    }
  } catch (error) {
    const message = String(error?.message || error || "Unknown error");
    if (!nodeRes.writableEnded) {
      nodeRes.statusCode = 500;
      nodeRes.setHeader("Content-Type", "application/json");
      nodeRes.end(
        JSON.stringify({
          ok: false,
          errorCode: "UNEXPECTED_ERROR",
          message,
        }),
      );
    }
  }
});

server.listen(port, host, () => {
  console.log(`[dev-api] listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
