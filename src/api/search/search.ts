import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";
import { Request, Response } from "express";

const search = Router();

search.use(token);

search.get("/users", (req: Request, res: Response) => {
  const text = `
  SELECT
    id,
    name,
    username,
    profile_pic,
    created_at,
    description
  FROM users
  WHERE LOWER(username) ILIKE $1
  OR LOWER(name) ILIKE $1
  ORDER BY created_at DESC;`;

  query(text, ["%" + req.query.q + "%"], (error, result) => {
    if (error) res.status(400).json(error);
    res.send(result.rows);
  });
});

search.get("/posts", (req: Request, res: Response) => {
  const text = `
    SELECT * FROM posts_view
    WHERE LOWER(text) ILIKE $1
    ORDER BY date DESC;
  `;

  return query(text, ["%" + req.query.q + "%"], (error, result) => {
    if (error) return res.status(400).json(error);
    return res.send(result.rows);
  });
});

search.get("/tags", (req: Request, res: Response) => {
  const text = `
    SELECT DISTINCT text, count
    FROM  (
    SELECT
      text,
      post_id,
      (count(*) OVER (PARTITION BY text))::int AS count
    FROM tags
    ) sub
    WHERE LOWER(text) ILIKE $1
    ORDER BY count DESC;`;

  query(text, ["%" + req.query.q + "%"], (error, result) => {
    if (error) return res.status(400).json(error);
    if (!result || !result.rows)
      return res.status(400).send({ message: "Something went wrong" });
    return res.send(result.rows);
  });
});

export default search;
