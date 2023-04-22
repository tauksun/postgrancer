function readyForQueryMessageBuffer() {
  const readyForQueryBuffer = Buffer.allocUnsafe(6);
  readyForQueryBuffer.write("Z");
  readyForQueryBuffer.writeInt32BE(5, 1);
  readyForQueryBuffer.write("I", 5);
  return readyForQueryBuffer;
}

export default readyForQueryMessageBuffer;
