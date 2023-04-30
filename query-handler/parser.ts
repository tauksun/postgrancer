import parser from "libpg-query";

async function messageParser(data: Buffer) {
  const libpgParsedResult: {
    data: unknown; ////////////////////////////////////////////////////
  } = { data: {} };
  // Seprate queries into an array
  let offset: number = 0;
  const messageTypeByte: number = data.readInt8(0);
  offset += 1;
  const messageTypeChar: string = String.fromCharCode(messageTypeByte);

  let query: string = "";
  const messageLength: number = data.readInt32BE(offset);
  offset += 4;

  if (messageTypeChar === "P") {
    let preparedStatement: string = "";
    for (let i = offset; i < messageLength; i++) {
      const byte = data.readInt8(i);
      const char = String.fromCharCode(byte);
      offset += 1;
      if (char === "\x00") {
        break;
      }
      preparedStatement += char;
    }
  }

  for (let i = offset; i <= messageLength; i++) {
    const byte = data.readInt8(i);
    const char = String.fromCharCode(byte);
    if (char === "\x00") {
      break;
    }
    query += char;
  }
  const queriesArray = query && query.split(";");

  // parse with libpg
  const parsedQueriesArray = [];
  // (queriesArray.length - 1) in below for-loop to
  // eliminate the last empty string after split
  for (let i = 0; i < queriesArray.length - 1; i++) {
    const parsedResult = await queryParser(queriesArray[i]);
    parsedQueriesArray.push(parsedResult);
  }
  libpgParsedResult.data = parsedQueriesArray;

  // return
  return libpgParsedResult;
}

const queryParser = async (
  query: string
): Promise<{
  result?: any;
  error?: string | unknown;
}> => {
  try {
    const result = await parser.parseQuery(query);
    ////////////////////////////////////
    ////////////////////////////////////
    ////////////////////////////////////
    ////////////////////////////////////
    ////////////////////////////////////
    ////////////////////////////////////
    return { result };
  } catch (error) {
    console.log({ error });
    return {
      error,
    };
  }
};

export default messageParser;
