import { request } from "http";
import { URL } from "url";

function httpRequest(params: { url: string }) {
  const { url } = params;
  const options = new URL(url);

}

export { httpRequest };
