import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";
import like from "./like/like";
import multer from "multer";
const upload = multer();
import { getImage, uploadImage } from "../../supabase/supabase";

const posts = Router();

posts.use(token);
posts.use("/like", like);

posts.get("/", (req, res, next) => {
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
  FROM posts
    JOIN users
      ON users.id=posts.author
    LEFT JOIN tags
      ON posts.id=tags.post_id
  GROUP BY
    posts.id,
    users.id
  ORDER BY date DESC;`;

  // const text = `
  // SELECT
  //   sub.tags,
  //   date,
  //   posts.text,
  //   author,
  //   username,
  //   name,
  //   profile_pic,
  //   posts.id AS id,
  //   posts.photo_url,
  //   posts.replying_to,
  //   COUNT(likes.post_id) as like_count
  // FROM (
  //   SELECT
  // 	  posts.id,
  // 	  COALESCE(ARRAY_AGG(tags.text) FILTER (WHERE tags.text IS NOT NULL), '{}') tags
  //   FROM posts
  // 	  LEFT JOIN tags
  // 	    ON posts.id=tags.post_id
  //   GROUP BY posts.id
  //   ORDER BY posts.date DESC
  // ) sub
  //   JOIN posts
  // 	  ON sub.id=posts.id
  //   LEFT JOIN likes
  // 	  ON likes.post_id=posts.id
  //   JOIN users
  //     ON users.id=posts.author
  // GROUP BY sub.id, sub.tags, posts.id, users.id
  // ORDER BY posts.date DESC;`;

  query(text, [], (error, result) => {
    if (error) return res.json(error);
    return res.send(result.rows);
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

  // const text = `
  // SELECT
  //   date,
  //   posts.text,
  //   author,
  //   username,
  //   name,
  //   profile_pic,
  //   posts.id AS id,
  //   posts.photo_url,
  //   posts.replying_to,
  //   COALESCE(ARRAY_AGG(tags.text) FILTER (WHERE tags.text IS NOT NULL), '{}') tags,
  //   COUNT(likes.post_id) as like_count
  // FROM user_following
  //   JOIN posts
  //     ON user_following.following_id=posts.author
  //   LEFT JOIN tags
  //     ON posts.id=tags.post_id
  //   JOIN users
  //     ON users.id=posts.author
  //   LEFT JOIN likes
  //     ON likes.post_id=posts.id
  // WHERE user_following.user_id=$1
  // GROUP BY
  //   posts.id,
  //   users.id
  // ORDER BY date DESC;`;

  if (!req.params.userId) res.status(200).send([]);

  query(text, [req.params.userId], (error, result) => {
    if (error) res.status(404).json(error);
    res.send(result.rows);
  });
});

posts.get("/:post_id", (req, res) => {
  const text = `
  SELECT
    name,
    date,
    posts.text,
    username,
    posts.photo_url,
    author,
    profile_pic,
    replying_to,
    posts.id AS id,
    COALESCE(ARRAY_AGG(tags.text) FILTER (WHERE tags.text IS NOT NULL), '{}') tags
  FROM users
    JOIN posts ON users.id=posts.author
    LEFT JOIN tags ON posts.id=tags.post_id
  WHERE posts.id=$1
  GROUP BY posts.id, users.id;`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(401).json(error);
    if (!result || !result.rows)
      return res.status(400).send({ message: "something went wrong" });
    return res.send(result.rows[0]);
  });
});

posts.post("/", upload.single("photo_file"), async (req, res) => {
  const { author, text, replying_to } = req.body;
  if (!author) return res.status(401).send({ message: "Something went wrong" });

  if (!text)
    return res.status(400).send({ message: "Please provide some text" });

  const file = req.file;
  let fileKey: string | null = null;

  if (file) {
    const { data, error } = await uploadImage(file);
    if (error) {
      return res.status(500).json(error);
    } else if (data) {
      fileKey = data.path;
    }
  }

  const str = `
  INSERT INTO posts (author, text, photo_url, replying_to)
  VALUES ($1, $2, $3, $4)
  RETURNING *;`;

  return query(str, [author, text, fileKey, replying_to], (error, result) => {
    if (error) return res.status(400).send(error);
    if (!result)
      return res.status(400).send({ message: "Something went wrong" });

    const id = result.rows[0].id;
    const tags = JSON.parse(req.body.tags);
    for (const tag of tags) {
      const tagQuery = `
        INSERT INTO tags (text, post_id)
        VALUES ($1, $2);`;

      query(tagQuery, [tag, id], (err, data) => {});
    }
    return res.send(result.rows);
  });
});

posts.get("/:post_id/likes", (req, res) => {
  const text = `
  SELECT COUNT(*)
  FROM likes
  WHERE post_id=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).send(error);
    if (!result)
      return res.status(400).send({ message: "Something went wrong" });
    if (!result.rows.length || !result.rows[0].count)
      return res.status(400).send({ message: "Something went wrong" });
    return res.send(result.rows[0].count);
  });
});

posts.get("/:post_id/photo_url/:photo_url", async (req, res) => {
  const fileKey = req.params.photo_url;
  await getImage(fileKey, res);
});

posts.get("/:post_id/reply-count", (req, res) => {
  const text = `
  SELECT COUNT(*) FROM posts
  WHERE replying_to=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) res.status(400).json(error);
    if (!result.rows.length || !result.rows[0].count) res.json(error);
    res.send(result.rows[0].count);
  });
});

// posts.get("/:post_id/tags", (req, res) => {
//   const text = `
//   SELECT text FROM tags
//   WHERE post_id=$1`;

//   query(text, [req.params.post_id], (error, result) => {
//     if (error) return res.status(400).json(error);
//     const asStringArray = result.rows.map((row) => row.text);
//     res.send(asStringArray);
//   });
// });

posts.get("/:post_id/replies", (req, res) => {
  const text = `
  SELECT date, text, author, username, name, profile_pic,
  posts.id AS id, posts.photo_url, posts.replying_to FROM posts
  JOIN users ON users.id=posts.author
  WHERE replying_to=$1`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) return res.status(400).json(error);
    if (!result)
      return res.status(400).send({ message: "Something went wrong" });
    return res.send(result.rows);
  });
});

posts.delete("/:post_id", (req, res) => {
  const text = `
  DELETE FROM posts
  WHERE id=$1;`;

  query(text, [req.params.post_id], (error, result) => {
    if (error) res.status(400).json(error);
    res.send(result.rows);
  });
});

export default posts;
