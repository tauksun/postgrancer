function xorBuffers(a: Buffer, b: Buffer): Buffer {
  if (!Buffer.isBuffer(a)) {
    throw new TypeError("first argument must be a Buffer");
  }
  if (!Buffer.isBuffer(b)) {
    throw new TypeError("second argument must be a Buffer");
  }
  if (a.length !== b.length) {
    throw new Error("Buffer lengths must match");
  }
  if (a.length === 0) {
    throw new Error("Buffers cannot be empty");
  }
  return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
}

export default xorBuffers;
