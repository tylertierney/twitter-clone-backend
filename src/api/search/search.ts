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
  WHERE LOWER(username) LIKE LOWER($1)
  OR LOWER(name) LIKE LOWER($1)
  ORDER BY created_at DESC;`;

  query(text, [req.query.q + "%"], (error, result) => {
    if (error) res.status(400).json(error);
    res.send(result.rows);
  });
});

search.get("/posts", (req: Request, res: Response) => {
  const text = `
  SELECT
    date,
    text,
    author,
    username,
    name,
    profile_pic,
    posts.id AS id,
    posts.photo_url,
    posts.replying_to
  FROM posts
  JOIN users ON users.id=posts.author
  WHERE LOWER(text) LIKE LOWER($1)
  ORDER BY date DESC;`;

  query(text, [req.query.q + "%"], (error, result) => {
    if (error) res.status(400).json(error);
    res.send(result.rows);
  });
});

search.get("/tags", (req: Request, res: Response) => {
  const text = `
  SELECT DISTINCT text, count
  FROM  (
   SELECT
    text,
    post_id,
    count(*) OVER (PARTITION BY text) AS count
   FROM tags
  ) sub
  WHERE LOWER(text) LIKE LOWER ($1)
  ORDER BY count DESC;`;

  query(text, [req.query.q + "%"], (error, result) => {
    if (error) return res.status(400).json(error);
    if (!result || !result.rows)
      return res.status(400).send({ message: "Something went wrong" });
    return res.send(result.rows);
  });
});

export default search;
