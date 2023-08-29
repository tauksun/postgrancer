import { _IpostgrancerDBConnectionData } from "../../database/interface";
import { session } from "../../database/session";

function finalizeSaslSession(params: {
  data: Buffer;
  _postgrancerDBConnectionData: _IpostgrancerDBConnectionData;
}) {
  const data = params.data;

  // Extract additonal data for primary db connections
  const dataMap: {
    [key: string]: string;
  } = {};

  for (let pos = 0; pos < data.length; pos += 0) {
    // Message Type
    const messageTypeByteValue = data.readInt8(pos);
    const messageType = String.fromCharCode(messageTypeByteValue);
    pos++;

    const messageLength = data.readInt32BE(pos);
    let additionalDataKey = "";
    let sepration = false;
    let additionalDataValue = "";

    // Read through individual message
    for (let i = 4; i < messageLength; i++) {
      const byteValue = data.readInt8(pos + i);
      const charValue = String.fromCharCode(byteValue);

      // Extract & Store Additional Data Values
      if (messageType === "S") {
        if (!sepration) {
          if (charValue !== "\x00") {
            additionalDataKey += charValue;
          } else {
            sepration = true;
          }
        } else {
          if (charValue !== "\x00") {
            additionalDataValue += charValue;
          }
        }
      }
    }
    pos += messageLength;
    if (additionalDataKey) {
      dataMap[additionalDataKey] = additionalDataValue;
    }
  }

  // Store Additional Data in session -> databaseMetaData
  if (!Object.keys(session.databaseMetaData).length) {
    session.databaseMetaData = dataMap;
  }

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
