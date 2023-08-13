import constants from "../../constants";

function isSSLRequest(data: Buffer): boolean {
  let isSSL = false;

  let offset = 0;
  const length = data.readInt32BE(offset);
  offset += 4;
  if (length === 8) {
    const message = data.readInt32BE(offset);
    const { postgresSSLIdentifier } = constants;
    if (message === postgresSSLIdentifier) {
      isSSL = true;
    }
  }

  return isSSL;
}

function sslNegotiationResponse(data: { enableSSL: boolean }): {
  data: Buffer;
} {
  const negotiationResponse = Buffer.allocUnsafe(1);
  const { enableSSL } = data;
  if (enableSSL) {
    negotiationResponse.write("S");
  } else {
    negotiationResponse.write("N");
  }

  return { data: negotiationResponse };
}

export { isSSLRequest, sslNegotiationResponse };
