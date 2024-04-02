import { Router, Request, Response } from "express";
import { query } from "../../db";
import multer from "multer";
const upload = multer();
import { token } from "../../middlewares/token";
import { getImage, uploadImage } from "../../supabase/supabase";

const users = Router();

users.use(token);

users.get("/", (req, res) => {
  const text = `
    SELECT * FROM users
    ORDER BY created_at DESC;`;
  query(text, [], (error, result) => {
    if (error) res.status(400).send(error);
    if (result.rows.length) {
      res.send(result.rows);
    }
  });
});

users.get("/:username/posts", (req, res) => {
  const text = `
    SELECT * FROM users
    WHERE username=$1;`;
  query(text, [req.params.username], (error, result) => {
    if (error) res.status(404).json(error);

    const q = `
    SELECT
      name,
      date,
      posts.text,
      username,
      author AS user_id,
      profile_pic,
      posts.id AS id,
      posts.photo_url,
      replying_to,
      COALESCE(ARRAY_AGG(tags.text) FILTER (WHERE tags.text IS NOT NULL), '{}') tags
    FROM users
      JOIN posts ON users.id=posts.author AND users.id=$1
      LEFT JOIN tags ON posts.id=tags.post_id
    GROUP BY posts.id, users.id, users.name
    ORDER BY date DESC;`;

    // const q = `
    // SELECT
    //   name,
    //   date,
    //   posts.text,
    //   username,
    //   author AS user_id,
    //   profile_pic,
    //   posts.id AS id,
    //   posts.photo_url,
    //   replying_to,
    //   COALESCE(ARRAY_AGG(tags.text) FILTER (WHERE tags.text IS NOT NULL), '{}') tags,
    //   COALESCE(ARRAY_AGG(likes.user_id), '{}') likes
    // FROM users
    //   JOIN posts ON users.id=posts.author AND users.id=$1
    //   LEFT JOIN tags ON posts.id=tags.post_id
    //   LEFT JOIN likes ON posts.id=likes.post_id
    // GROUP BY posts.id, users.id, users.name
    // ORDER BY date DESC;`;

    if (!result.rows.length) res.status(404).json("something went wrong");
    query(q, [result.rows[0].id], (err, data) => {
      console.log(err);
      if (err) res.status(404).json(err);

      res.status(200).send(data.rows);
    });
  });
});

users.get("/:username", (req, res, next) => {
  const text = "SELECT * FROM users WHERE users.username = $1;";
  query(text, [req.params.username], (error, result) => {
    if (error) return next(error);
    const user = result.rows[0];
    res.send(user);
  });
});

users.get("/:username/header_pic/:header_pic", async (req, res) => {
  const fileKey = req.params.header_pic;
  await getImage(fileKey, res);
});

users.get("/:username/profile_pic/:profile_pic", async (req, res) => {
  const fileKey = req.params.profile_pic;
  await getImage(fileKey, res);
});

users.put(
  "/:username/header_pic",
  upload.single("header_pic"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json("No file");
    }

    const { data, error } = await uploadImage(file);

    if (error) {
      return res.status(500).send(error);
    }

    if (!data) {
      return res.status(500).send("Something went wrong");
    }

    const text = `
          UPDATE users
          SET header_pic = $1
          WHERE username=$2
          RETURNING *;`;

    return query(text, [data.path, req.params.username], (error, data) => {
      if (error) return res.status(400).json(error);
      if (!data.rows.length)
        return res.status(400).json("Something went wrong");

      const { password, ...user } = data.rows[0];

      return res.status(200).json(user);
    });
  }
);

users.put(
  "/:username/profile_pic",
  upload.single("profile_pic"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json("No file");
    }

    const { data, error } = await uploadImage(file);

    if (error) {
      return res.status(500).send(error);
    }

    if (!data) {
      return res.status(500).send("Something went wrong");
    }

    const text = `
        UPDATE users
        SET profile_pic = $1
        WHERE username=$2
        RETURNING *;`;

    console.log(data.path);
    return query(text, [data.path, req.params.username], (error, data) => {
      if (error) return res.status(500).json(error);

      if (!data.rows.length)
        return res.status(500).json("Something went wrong");

      const { password, ...user } = data.rows[0];

      console.log(user);

      return res.status(200).json(user);
    });
  }
);

users.put("/:username/nameAndDescription", (req, res) => {
  const { description, name } = req.body;

  if (!name) res.status(400).send({ message: "You have to have a name" });

  if (name.length > 50)
    res.status(400).send({ message: "Name must not exceed 50 characters" });
  if (description.length > 160)
    res
      .status(400)
      .send({ message: "Description must not exceed 160 characters" });

  const text = `
    UPDATE users
    SET description=$1, name=$2
    WHERE username=$3
    RETURNING *;`;

  query(text, [description, name, req.params.username], (error, result) => {
    if (error) res.json(error);
    if (!result.rows.length)
      res.status(400).send({ message: "Something went wrong" });
    const { password, ...user } = result.rows[0];
    res.status(200).json(user);
  });
});

users.get("/:user_id/following", (req, res) => {
  const text = `
  SELECT COUNT(*)
  FROM user_following
  WHERE user_id=$1;`;

  query(text, [req.params.user_id], (error, result) => {
    if (error) res.json(error);
    if (!result.rows.length || !result.rows[0].count)
      res.status(400).json("Something went wrong");
    res.send(result.rows[0].count);
  });
});

users.get("/:user_id/followers", (req, res) => {
  const text = `
  SELECT COUNT(*)
  FROM user_following
  WHERE following_id=$1;`;

  query(text, [req.params.user_id], (error, result) => {
    if (error) res.json(error);
    if (!result.rows.length || !result.rows[0].count)
      res.status(400).json("Something went wrong");
    res.send(result.rows[0].count);
  });
});

export default users;
