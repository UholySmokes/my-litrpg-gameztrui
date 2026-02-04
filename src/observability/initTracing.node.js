import process from "node:process";
import { diag, DiagConsoleLogger, DiagLogLevel, trace } from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

let sdk;

const toBool = (value) => {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value !== "string") return false;
  const lowered = value.trim().toLowerCase();
  return lowered === "1" || lowered === "true" || lowered === "yes" || lowered === "on";
};

export function isNodeTracingEnabled() {
  return toBool(process.env.TRACE_ENABLED || process.env.OTEL_TRACES_ENABLED);
}

/**
 * Initialize OpenTelemetry tracing for Node entrypoints (simulation, scripts, etc.).
 *
 * Default OTLP endpoint for AI Toolkit trace collector:
 *   http://localhost:4318/v1/traces
 */
export async function initNodeTracing({ serviceName = "my-litrpg-gameztrui" } = {}) {
  if (!isNodeTracingEnabled()) {
    return { enabled: false, shutdown: async () => {} };
  }

  if (sdk) {
    return { enabled: true, shutdown: () => shutdownNodeTracing() };
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const endpointBase =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
  const url = endpointBase.endsWith("/v1/traces")
    ? endpointBase
    : `${endpointBase.replace(/\/$/, "")}/v1/traces`;

  const exporter = new OTLPTraceExporter({ url });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  await sdk.start();

  globalThis.__LITRPG_TRACER__ = trace.getTracer(serviceName);

  return { enabled: true, shutdown: () => shutdownNodeTracing() };
}

export async function shutdownNodeTracing() {
  if (!sdk) return;
  const current = sdk;
  sdk = undefined;
  try {
    await current.shutdown();
  } finally {
    if (globalThis.__LITRPG_TRACER__) {
      delete globalThis.__LITRPG_TRACER__;
    }
  }
}
