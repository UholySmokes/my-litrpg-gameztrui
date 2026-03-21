function randomHex(length) {
  if (globalThis?.crypto?.getRandomValues) {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, length);
  }

  let fallback = "";
  while (fallback.length < length) {
    fallback += Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
  }
  return fallback.slice(0, length);
}

export function createRequestTraceContext() {
  return {
    traceId: randomHex(32),
    spanId: randomHex(16),
  };
}
