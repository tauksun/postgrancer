function isReadyForQuery(data: Buffer): boolean {
  const bufferLength = data.byteLength;
  const lastByte = data.readInt8(bufferLength - 1);
  const lastChar = String.fromCharCode(lastByte);
  // 'I' if idle (not in a transaction block);
  // 'T' if in a transaction block;
  // 'E' if in a failed transaction block
  if (lastChar === "I") {
    return true;
  }
  return false;
}

export default isReadyForQuery;
