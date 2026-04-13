import { Buffer } from "node:buffer";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../functions/lib/api-router.js");

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

async function readRawBody(req) {
  if (req.rawBody) {
    return Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : Buffer.from(req.rawBody);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : Buffer.alloc(0);
}

function adaptResponse(res) {
  const adapted = res;
  adapted.locals = adapted.locals || {};

  if (typeof adapted.status !== "function") {
    adapted.status = (code) => {
      adapted.statusCode = code;
      return adapted;
    };
  }

  if (typeof adapted.set !== "function") {
    adapted.set = (key, value) => {
      adapted.setHeader(key, value);
      return adapted;
    };
  }

  if (typeof adapted.json !== "function") {
    adapted.json = (body) => {
      if (!adapted.getHeader?.("Content-Type")) {
        adapted.setHeader("Content-Type", "application/json");
      }
      if (!adapted.writableEnded) {
        adapted.end(JSON.stringify(body));
      }
      return adapted;
    };
  }

  if (typeof adapted.send !== "function") {
    adapted.send = (body = "") => {
      if (adapted.writableEnded) return adapted;
      if (typeof body === "object" && body !== null && !Buffer.isBuffer(body)) {
        return adapted.json(body);
      }
      adapted.end(body);
      return adapted;
    };
  }

  return adapted;
}

export default async function handler(req, res) {
  try {
    const rawBody = await readRawBody(req);
    if (!req.originalUrl) {
      req.originalUrl = req.url;
    }
    if (!req.rawBody) {
      req.rawBody = rawBody;
    }
    if (typeof req.body === "undefined") {
      req.body = parseBody(rawBody, req.headers);
    }

    await handleApiRequest(req, adaptResponse(res));
  } catch (error) {
    const message = String(error?.message || error || "Unknown error");
    res.status(500).json({
      ok: false,
      errorCode: "UNEXPECTED_ERROR",
      message,
    });
  }
}
