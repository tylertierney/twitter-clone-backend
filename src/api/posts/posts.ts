import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";
import { getFileStream } from "../../s3/s3";
import like from "./like/like";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import { uploadFile } from "../../s3/s3";
import util from "util";
import fs from "fs";
const unlinkFile = util.promisify(fs.unlink);

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

// posts.get("/:userId/feed", (req, res) => {
//   const text = `
//   SELECT date, text, author, username, name, profile_pic,
//   posts.id AS id, posts.photo_url, posts.replying_to
//   FROM user_following
// 	  JOIN posts ON user_following.following_id=posts.author
//     JOIN users ON users.id=posts.author
//   WHERE user_id=$1
//   ORDER BY date DESC;`;

//   query(text, [req.params.userId], (error, result) => {
//     if (error) return res.status(404).json(error);

//     res.send(result.rows);
//   });
// });

// NEW STUFF
posts.get("/:userId/feed", (req, res) => {
  const text = `
  SELECT
    date,
    posts.text,
    author,
    username,
    name,
    profile_pic,
    posts.id AS id,
    posts.photo_url,
    posts.replying_to,
    COALESCE(ARRAY_AGG(tags.text) FILTER (WHERE tags.text IS NOT NULL), '{}') tags
  FROM user_following
    JOIN posts ON user_following.following_id=posts.author
    LEFT JOIN tags ON posts.id=tags.post_id
    JOIN users ON users.id=posts.author
  WHERE user_id=$1
  GROUP BY
    posts.id,
    users.id
  ORDER BY date DESC;`;

  query(text, [req.params.userId], (error, result) => {
    if (error) return res.status(404).json(error);
    // console.log(result.rows);
    res.send(result.rows);
  });
});

posts.get("/:post_id", (req, res) => {
  const text = `
  SELECT
  name, date, text, username, posts.photo_url,
  author, profile_pic, replying_to, posts.id AS id
  FROM users
    JOIN posts
    ON users.id=posts.author
  WHERE posts.id=$1;`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.json(error);
    if (!result.rows.length)
      return res.status(400).json("something went wrong");
    res.send(result.rows[0]);
  });
});

posts.post("/", upload.single("photo_file"), async (req, res) => {
  // console.log(req.body);
  // console.log(JSON.parse(req.body.tags));
  // res.send({ message: "great" });

  const { author, text, replying_to } = req.body;
  if (!author) return res.status(401).json("Something went wrong");

  if (!text) return res.status(400).json("Please provide some text");

  const file = req.file;
  let fileKey: string | null = null;

  if (file) {
    try {
      const result = await uploadFile(file);
      await unlinkFile(file.path);
      if (result.Key) fileKey = result.Key;
    } catch (err) {
      return res.status(400).json(err);
    }
  }

  const str = `
  INSERT INTO posts (author, text, photo_url, replying_to)
  VALUES ($1, $2, $3, $4)
  RETURNING *;`;

  query(str, [author, text, fileKey, replying_to], (error, result) => {
    if (error || !result.rows.length) {
      res.send({ error: error });
    } else {
      const id = result.rows[0].id;
      const tags = JSON.parse(req.body.tags);
      for (const tag of tags) {
        const tagQuery = `
        INSERT INTO tags (text, post_id)
        VALUES ($1, $2);`;

        query(tagQuery, [tag, id], (err, data) => {});
      }
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

posts.get("/:post_id/reply-count", (req, res) => {
  const text = `
  SELECT COUNT(*) FROM posts
  WHERE replying_to=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).json(error);
    if (!result.rows.length || !result.rows[0].count) return res.json(error);
    res.send(result.rows[0].count);
  });
});

posts.get("/:post_id/tags", (req, res) => {
  const text = `
  SELECT text FROM tags
  WHERE post_id=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).json(error);
    const asStringArray = result.rows.map((row) => row.text);
    res.send(asStringArray);
  });
});

posts.get("/:post_id/replies", (req, res) => {
  const text = `
  SELECT date, text, author, username, name, profile_pic,
  posts.id AS id, posts.photo_url, posts.replying_to FROM posts
  JOIN users ON users.id=posts.author
  WHERE replying_to=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).json(error);
    res.send(result.rows);
  });
});

posts.delete("/:post_id", (req, res) => {
  const text = `
  DELETE FROM posts
  WHERE id=$1;`;

  console.log("called delete method");
  console.log(req.params.post_id);

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).json(error);
    console.log(result.rows);
    res.send(result.rows);
  });
});

// ALTER TABLE likes DROP CONSTRAINT likes_post_id_fkey, ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
// ALTER TABLE posts DROP CONSTRAINT replying_to, ADD CONSTRAINT replying_to FOREIGN KEY (replying_to) REFERENCES posts(id) NOT VALID ON DELETE CASCADE;

export default posts;
