module.exports = async function narrate(context, req) {
  const body =
    req && req.body && typeof req.body === "object" && req.body !== null
      ? req.body
      : typeof req?.body === "string"
        ? (() => {
            try {
              return JSON.parse(req.body);
            } catch {
              return {};
            }
          })()
        : {};

  context.res = {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: { ok: true, message: "narrate stub", received: body },
  };
};

