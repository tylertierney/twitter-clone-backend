import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";

const tags = Router();

tags.use(token);

tags.get("/", (req, res) => {
  const text = `
  SELECT DISTINCT text, ct
  FROM  (
   SELECT
    text,
    post_id,
    count(*) OVER (PARTITION BY text) AS ct
   FROM tags
  ) sub
  ORDER BY ct DESC
  LIMIT 10;`;

  query(text, [], (error, result) => {
    if (error) res.status(400).json(error);
    res.send(result.rows);
  });
});

export default tags;
