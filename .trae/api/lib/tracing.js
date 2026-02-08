const process = require("node:process");

const { diag, DiagConsoleLogger, DiagLogLevel, trace } = require("@opentelemetry/api");
const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = require("@opentelemetry/semantic-conventions");
const { NodeSDK } = require("@opentelemetry/sdk-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");

let sdk;

const toBool = (value) => {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value !== "string") return false;
  const lowered = value.trim().toLowerCase();
  return lowered === "1" || lowered === "true" || lowered === "yes" || lowered === "on";
};

function isPromiseLike(value) {
  return value && (typeof value === "object" || typeof value === "function")
    ? typeof value.then === "function"
    : false;
}

function isTracingEnabled() {
  return toBool(process.env.TRACE_ENABLED || process.env.OTEL_TRACES_ENABLED);
}

async function startSdk(serviceName) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const endpointBase = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
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
}

function initApiTracing({ serviceName = "void-verse-api" } = {}) {
  if (!isTracingEnabled()) {
    return { enabled: false };
  }

  if (sdk) {
    return { enabled: true };
  }

  // Fire and forget; Azure Functions may load modules sync.
  // The shim will remain no-op until tracer is assigned.
  void startSdk(serviceName);
  return { enabled: true };
}

function withTraceSpan(name, attributes, fn) {
  const tracer = globalThis.__LITRPG_TRACER__;
  if (!tracer || typeof tracer.startActiveSpan !== "function") {
    return fn();
  }

  return tracer.startActiveSpan(
    String(name || "span"),
    { attributes: attributes && typeof attributes === "object" ? attributes : {} },
    (span) => {
      try {
        const result = fn(span);
        if (isPromiseLike(result)) {
          return result
            .then((value) => {
              span.end();
              return value;
            })
            .catch((error) => {
              if (typeof span.recordException === "function") span.recordException(error);
              if (typeof span.setStatus === "function") {
                span.setStatus({ code: 2, message: String(error?.message || error) });
              }
              span.end();
              throw error;
            });
        }
        span.end();
        return result;
      } catch (error) {
        if (typeof span.recordException === "function") span.recordException(error);
        if (typeof span.setStatus === "function") {
          span.setStatus({ code: 2, message: String(error?.message || error) });
        }
        span.end();
        throw error;
      }
    },
  );
}

module.exports = {
  initApiTracing,
  withTraceSpan,
};
