function queryBuffer(params: { query: string }): {
  queryBuffer: Buffer;
} {
  const { query } = params;
  const queryLength = Buffer.byteLength(query);
  // 1 (Message Type Identifier) + 4 (Message length)
  // + Query Length + 1 (Terminator)
  const bufferLength = 1 + 4 + queryLength + 1;
  const queryBuffer = Buffer.allocUnsafe(bufferLength);
  let offset = 0;
  queryBuffer.write("Q", offset);
  offset += 1;
  queryBuffer.writeInt32BE(4 + queryLength + 1, offset);
  offset += 4;
  queryBuffer.write(query, offset);
  offset += queryLength;
  queryBuffer.write("\0", offset);

  return { queryBuffer };
}

export { queryBuffer };
