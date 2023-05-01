import { identifier } from "../query-handler";
import isReadyForQuery from "./is-ready-for-query";
import { IpostgranceDBSocket } from "./interface";

function checkAndUnblock(params: {
  data: Buffer;
  dbConnection: IpostgranceDBSocket;
}) {
  const { data, dbConnection } = params;


  // Unlock database connection on current statement completion
  const statementCompletionMessageTypes: string[] = [
    "commandComplete",
    "closeComplete",
    "emptyQueryResponse",
    "errorResponse",
    "functionCallResponse",
    "noData",
    "readyForQuery",
  ];
  const messageType = identifier({ data, sender: "db" });

  const clientSocketConnection =
    dbConnection._postgrancerDBConnectionData &&
    dbConnection._postgrancerDBConnectionData?.clientSocketConnection;

  const isExtendedQuery = clientSocketConnection?.isExtendedQuery;

  if (!isExtendedQuery) {
    if (
      isReadyForQuery(data) ||
      statementCompletionMessageTypes.includes(messageType)
    ) {
      dbConnection.locked = false;
    }
  }
}

export default checkAndUnblock;
