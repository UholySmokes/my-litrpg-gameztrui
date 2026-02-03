module.exports = async function voidverseFunction(context, req) {
  context.res = {
    status: 501,
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      ok: false,
      error: "VoidverseFunction is disabled in Azure Static Web Apps.",
      detail:
        "Durable entity triggers are not supported here. Remove this function or migrate it to a full Azure Functions app if needed.",
    },
  };
};
