function deepClone(params: {
  target: {
    [key: string]: any;
  };
  source: {
    [key: string]: any;
  };
}) {
  const { target, source } = params;
  const objectData = Object.getOwnPropertyDescriptors(source);
  const keys = Object.keys(objectData);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = objectData[key].value;
    if (typeof value === "object") {
      const clonedValue = deepClone({ target: {}, source: value });
      target[key] = clonedValue;
    } else {
      target[key] = value;
    }
  }
  return target;
}

export default deepClone;
