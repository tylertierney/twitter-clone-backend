import { Pool, QueryResult } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env["PGUSER"],
  host: process.env["PGHOST"],
  database: process.env["PGDATABASE"],
  port: Number(process.env["PORT"]) || 0,
});

export const query = (
  text: string,
  params: any[],
  callback: (err: Error, result: QueryResult<any>) => void
) => {
  return pool.query(text, params, callback);
};
