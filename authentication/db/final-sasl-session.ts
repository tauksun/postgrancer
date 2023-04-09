import { _IpostgrancerDBConnectionData } from "../../database/interface";

function finalizeSaslSession(params: {
  data: Buffer;
  _postgrancerDBConnectionData: _IpostgrancerDBConnectionData;
}) {
  const data = params.data;
  let offset = 0;
  // Message Byte
  offset += 1;
  const serverResponseLength = data.readInt32BE(offset);
  // Message Length
  offset += 4;
  const authTypeCode = data.readInt32BE(offset);
  // Auth Type code
  offset += 4;
  let serverResponse = "";
  for (let i = offset; i <= serverResponseLength; i++) {
    const char = String.fromCharCode(data[i]);
    serverResponse += char;
  }
  const message = serverResponse;

  // Extract Attributes
  const attributes = new Map(
    message.split(",").map((attrValue) => {
      if (!/^.=/.test(attrValue)) {
        throw new Error("SASL: Invalid attribute pair entry");
      }
      const name = attrValue[0];
      const value = attrValue.substring(2);
      return [name, value];
    })
  );

  const serverSignature = attributes.get("v");
  const _postgrancerDBConnectionData = params._postgrancerDBConnectionData;
  if (!(serverSignature === _postgrancerDBConnectionData.serverSignature)) {
    throw new Error("Server Signature doesn't match.");
  }
}

export default finalizeSaslSession;
