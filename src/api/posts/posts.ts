import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";
import { getFileStream } from "../../s3/s3";
import like from "./like/like";

const posts = Router();

posts.use(token);
posts.use("/like", like);

posts.get("/", (req, res, next) => {
  const text = `
  SELECT
  name, date, text, username,
  author AS user_id, profile_pic
  FROM users
    JOIN posts
    ON users.id=posts.author
  ORDER BY date DESC;`;

  query(text, [], (error, result) => {
    if (error) return res.json(error);
    res.send(result.rows);
  });
});

posts.get("/:userId/feed", (req, res) => {
  const text = `
  SELECT date, text, author, username, name, profile_pic, 
  posts.id AS id, posts.photo_url
  FROM user_following 
	  JOIN posts ON user_following.following_id=posts.author
    JOIN users ON users.id=posts.author
  WHERE user_id=$1
  ORDER BY date DESC;`;

  query(text, [req.params.userId], (error, result) => {
    if (error) return res.status(404).json(error);
    res.send(result.rows);
  });
});

posts.get("/:username", (req, res) => {
  const text = `
  SELECT * FROM users
  WHERE username=$1;`;
  query(text, [req.params.username], (error, result) => {
    if (error) return res.status(404).json(error);

    const q = `
    SELECT
    name, date, text, username,
    author AS user_id, profile_pic, posts.id AS id,
    posts.photo_url
    FROM users
    JOIN posts
    ON users.id=posts.author
    AND users.id=$1
    ORDER BY date DESC;`;

    if (!result.rows.length)
      return res.status(404).json("something went wrong");
    query(q, [result.rows[0].id], (err, data) => {
      if (err) return res.status(404).json(err);

      res.status(200).send(data.rows);
    });
  });
});

posts.post("/", (req, res) => {
  const { author, text } = req.body;
  console.log(req.body);
  if (!author || !text) {
    res.status(400).send({ message: "Please provide some text content" });
    return;
  }
  const str = `
  INSERT INTO posts (author, text)
  VALUES ($1, $2)`;

  query(str, [author, text], (error, result) => {
    if (error) {
      res.send({ error: error });
    } else {
      res.send(result.rows);
    }
  });
});

posts.get("/:post_id/likes", (req, res) => {
  const text = `
  SELECT COUNT(*)
  FROM likes
  WHERE post_id=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).json(error);
    if (!result.rows.length || !result.rows[0].count) return res.json(error);
    res.send(result.rows[0].count);
  });
});

posts.get("/:post_id/photo_url/:photo_url", (req, res) => {
  const key = req.params.photo_url;
  const readStream = getFileStream(key);
  readStream.pipe(res);
});

export default posts;
