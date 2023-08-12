function authenticationOK(): {
  data: Buffer;
} {
  const authenticationOKBuffer = Buffer.allocUnsafe(9);
  authenticationOKBuffer.write("R");
  authenticationOKBuffer.writeInt32BE(8, 1);
  authenticationOKBuffer.writeInt32BE(0, 5);
  return { data: authenticationOKBuffer };
}

export default authenticationOK;
