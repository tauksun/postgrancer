const fetch = require("node-fetch");
type httpMethod = "get" | "post";

async function httpRequest(params: {
  method: httpMethod;
  url: string;
  data?: any;
  headers?: any;
}) {
  try {
    const { method, url, data = {}, headers = null } = params;

    const defaultHeaders = {
      "content-type": "application/json",
    };
    await fetch(url, {
      method,
      body: JSON.stringify(data),
      headers: headers || defaultHeaders,
    });
  } catch (error) {
    console.log("Error occured during http request : ", error);
  }
}

export { httpRequest };
