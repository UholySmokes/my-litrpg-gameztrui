import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { handleApiRequest } = require("../functions/lib/api-router.js");

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100kb",
    },
  },
};

export default async function handler(req, res) {
  try {
    if (!req.originalUrl) {
      req.originalUrl = req.url;
    }
    await handleApiRequest(req, res);
  } catch (error) {
    const message = String(error?.message || error || "Unknown error");
    res.status(500).json({
      ok: false,
      errorCode: "UNEXPECTED_ERROR",
      message,
    });
  }
}
