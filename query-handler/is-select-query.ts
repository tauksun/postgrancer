function isSelectStatment(
  queryParsedStatements: { result: any; error?: any }[]
): boolean {
  let isSelect = false;
  const totalStatements = queryParsedStatements.length;
  let totalSelectStatements = 0;

  for (let i = 0; i < totalStatements; i++) {
    const queryParsedStatement = queryParsedStatements[i];
    const statements =
      queryParsedStatement &&
      queryParsedStatement.result &&
      queryParsedStatement.result.stmts;
    const statement = statements && statements[0].stmt;
    const statementType = statement && Object.keys(statement)[0];

    if (statementType === "SelectStmt") {
      totalSelectStatements += 1;
    }
  }

  if (totalSelectStatements && totalSelectStatements === totalStatements) {
    isSelect = true;
  }

  return isSelect;
}

export default isSelectStatment;
