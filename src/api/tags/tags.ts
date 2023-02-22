import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";

const tags = Router();

tags.use(token);

tags.get("/", (req, res) => {
  const text = `
  SELECT DISTINCT text, count
  FROM  (
   SELECT
    text,
    post_id,
    count(*) OVER (PARTITION BY text) AS count
   FROM tags
  ) sub
  ORDER BY count DESC
  LIMIT 10;`;

  query(text, [], (error, result) => {
    if (error) res.status(400).json(error);
    res.send(result.rows);
  });
});

export default tags;
