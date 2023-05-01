function identifier(params: {
  data: Buffer;
  sender?: "client" | "db";
}): string {
  let identity = "";
  // Read First message Byte
  const data = params.data;
  const sender = params.sender || "client";
  if (!data.byteLength) {
    return "";
  }
  const firstByte = data.readInt8(0);
  const firstByteChar = String.fromCharCode(firstByte);

  switch (firstByteChar) {
    case "R":
      identity = "auth";
      break;

    case "X":
      identity = "terminate";
      break;

    case "Z":
      if (sender === "db") {
        identity = "readyForQuery";
      }
      break;

    case "Q":
      identity = "simpleQuery";
      break;

    case "P":
      identity = "parseCommand";
      break;

    case "B":
      identity = "bindCommand";
      break;

    case "F":
      identity = "functionCall";
      break;

    case "H":
      identity = "flush";
      break;

    case "E":
      identity = "execute";
      if (sender === "db") {
        identity = "errorResponse";
      }
      break;

    case "D":
      identity = "describe";
      if (sender === "db") {
        identity = "dataRow";
      }
      break;

    case "d":
      identity = "copyData";
      break;

    case "c":
      identity = "copyDone";
      break;

    case "f":
      identity = "copyFail";
      break;

    case "C":
      identity = "close";
      if (sender === "db") {
        identity = "commandComplete";
      }
      break;

    case "S":
      identity = "sync";
      break;

    case "3":
      if (sender === "db") {
        identity = "closeComplete";
      }
      break;

    case "I":
      if (sender === "db") {
        identity = "emptyQueryResponse";
      }
      break;

    case "V":
      if (sender === "db") {
        identity = "functionCallResponse";
      }
      break;

    case "n":
      if (sender === "db") {
        identity = "noData";
      }
      break;

    case "T":
      if (sender === "db") {
        identity = "rowDescription";
      }
      break;

    default:
      break;
  }
  return identity;
}

export default identifier;
