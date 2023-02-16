import { Pool, QueryResult } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env["PGUSER"],
  host: process.env["PGHOST"],
  database: process.env["PGDATABASE"],
  port: parseInt(process.env["PGPORT"] ?? "", 10),
});

console.log("port = " + parseInt(process.env["PGPORT"] ?? "", 10));

export const query = (
  text: string,
  params: any[],
  callback: (err: Error, result: QueryResult<any>) => void
) => {
  return pool.query(text, params, callback);
};
