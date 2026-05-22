export function jsonResponse(
  body: unknown,
  status: number = 200,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

export function jsonErrorResponse(
  errorCode: string,
  message: string,
  status: number = 500,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
): Response {
  return jsonResponse(
    {
      ok: false,
      errorCode,
      message,
      ...extra,
    },
    status,
    headers,
  );
}

export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return {};
  }
  try {
    const text = await req.text();
    if (!text.trim()) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}
