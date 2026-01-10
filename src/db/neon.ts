import postgres, { ParameterOrJSON } from "postgres";

const connectionString = process.env.NEXT_PUBLIC_DATABASE_URL;

if (!connectionString) {
  throw new Error("NEXT_PUBLIC_DATABASE_URL is not set");
}

const sql = postgres(connectionString);

export default sql;

export const query = sql;

export type ParamType = string | number | boolean | null;

export type SqlParam = ParameterOrJSON<ParamType>;

export function queryRaw<T = unknown>(query: string, params: SqlParam[] = []) {
  return sql.unsafe<T[]>(query, params);
}
