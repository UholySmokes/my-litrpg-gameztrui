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

/**
 * Check if tracing is enabled based on provided configuration.
 * This function should be called with explicit config, not environment variables.
 * @param {Object} config - Configuration object
 * @param {boolean|string} config.tracingEnabled - Whether tracing is enabled
 * @returns {boolean} True if tracing is enabled
 */
export function isTracingEnabled(config = {}) {
  return toBool(config.tracingEnabled);
}

/**
 * Legacy function for backwards compatibility.
 * @deprecated Use isTracingEnabled(config) with explicit config instead
 */
export function isNodeTracingEnabled() {
  // For backwards compatibility, still check environment
  // But this function should be phased out in favor of explicit config
  return toBool(process.env.TRACE_ENABLED || process.env.OTEL_TRACES_ENABLED);
}

/**
 * Initialize OpenTelemetry tracing for Node entrypoints (simulation, scripts, etc.).
 * 
 * Configuration should be provided explicitly rather than relying on environment variables.
 * For platform-neutral code, configuration should be injected by the platform-specific layer.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.serviceName - Service name for tracing (default: "my-litrpg-gameztrui")
 * @param {boolean|string} config.tracingEnabled - Whether tracing is enabled
 * @param {string} config.otlpEndpoint - OTLP endpoint URL (default: "http://localhost:4318")
 * @returns {Promise<Object>} Object with enabled flag and shutdown function
 */
export async function initNodeTracing({ 
  serviceName = "my-litrpg-gameztrui",
  tracingEnabled,
  otlpEndpoint = "http://localhost:4318"
} = {}) {
  // If tracingEnabled not provided, fall back to environment check for backwards compatibility
  const enabled = tracingEnabled !== undefined ? 
    toBool(tracingEnabled) : 
    isNodeTracingEnabled();
    
  if (!enabled) {
    return { enabled: false, shutdown: async () => {} };
  }

  if (sdk) {
    return { enabled: true, shutdown: () => shutdownNodeTracing() };
  }

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  // Use provided endpoint, with backwards compatibility for environment variable
  const endpointBase = otlpEndpoint || 
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 
    "http://localhost:4318";
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
