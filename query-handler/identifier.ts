function identifier(params: { data: Buffer }): string {
  let identity = "";
  // Read First message Byte
  const data = params.data;
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
      identity = "readyForQuery";
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
      break;

    case "D":
      identity = "describe";
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
      break;

    case "S":
      identity = "sync";
      break;

    default:
      break;
  }
  return identity;
}

export default identifier;
