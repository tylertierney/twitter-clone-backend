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

  return query(text, [], (error, result) => {
    if (error) return res.status(400).json(error);
    return res.send(result?.rows);
  });
});

tags.get("/:tag", (req, res) => {
  const text = `
    SELECT * FROM posts_view
    WHERE $1=ANY(tags);
  `;

  query(text, [req.params.tag], (error, result) => {
    if (error || !result)
      return res.status(400).send({ message: "Something went wrong" });
    return res.send(result.rows);
  });
});

export default tags;
