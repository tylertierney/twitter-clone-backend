import { NextFunction, Router, Request, Response } from "express";
import jwt, { verify, VerifyCallback, VerifyErrors } from "jsonwebtoken";
import { query } from "../../db";
import multer from "multer";
const upload = multer({ dest: "uploads/" });
import { getFileStream, uploadFile } from "../../s3/s3";
import fs from "fs";
import util from "util";
import { token } from "../../middlewares/token";
const unlinkFile = util.promisify(fs.unlink);

const users = Router();

users.use(token);

users.get("/", (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Not authenticated");

  const callback: VerifyCallback = (err, data) => {
    if (err) return res.status(403).json("Token not valid");

    const text = "SELECT * FROM users";
    query(text, [], (error, result) => {
      if (error) return res.json(error);
      if (result.rows.length) {
        res.send(result.rows);
      }
    });
  };

  jwt.verify(token, "jwtkey", callback);
});

users.get("/:username/posts", (req, res) => {
  const text = `
  SELECT * FROM users
  WHERE username=$1;`;
  query(text, [req.params.username], (error, result) => {
    if (error) return res.status(404).json(error);

    const q = `
    SELECT
    name, date, text, username,
    author AS user_id, profile_pic, posts.id AS id,
    posts.photo_url, replying_to
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

users.get("/:username", (req, res, next) => {
  const text = "SELECT * FROM users WHERE users.username = $1;";
  query(text, [req.params.username], (error, result) => {
    if (error) return next(error);
    const user = result.rows[0];
    res.send(user);
  });
});

users.get("/:username/header_pic/:header_pic", (req, res) => {
  const key = req.params.header_pic;
  const readStream = getFileStream(key);
  readStream.pipe(res);
});

users.get("/:username/profile_pic/:profile_pic", (req, res) => {
  const key = req.params.profile_pic;
  const readStream = getFileStream(key);
  readStream.pipe(res);
});

users.put(
  "/:username/header_pic",
  upload.single("header_pic"),
  async (req, res) => {
    const file = req.file;
    if (!req.file) return res.status(400).json("No file");

    try {
      const result = await uploadFile(file);
      await unlinkFile(file.path);

      const text = `
      UPDATE users
      SET header_pic = $1
      WHERE username=$2
      RETURNING *;`;

      query(text, [result.Key, req.params.username], (error, data) => {
        if (error) return res.status(400).json(error);
        if (!data.rows.length)
          return res.status(400).json("Something went wrong");

        const { password, ...user } = data.rows[0];

        res.status(200).json(user);
      });
    } catch (err) {
      res.status(400).json(err);
    }
  }
);

users.put(
  "/:username/profile_pic",
  upload.single("profile_pic"),
  async (req, res) => {
    const file = req.file;
    if (!req.file) return res.status(400).json("No file");

    try {
      const result = await uploadFile(file);
      await unlinkFile(file.path);

      const text = `
      UPDATE users
      SET profile_pic = $1
      WHERE username=$2
      RETURNING *;`;

      query(text, [result.Key, req.params.username], (error, data) => {
        if (error) return res.status(400).json(error);

        if (!data.rows.length)
          return res.status(400).json("Something went wrong");

        const { password, ...user } = data.rows[0];

        res.status(200).json(user);
      });
    } catch (err) {
      res.status(400).json(err);
    }
  }
);

users.put("/:username/nameAndDescription", (req, res) => {
  console.log(req.body);
  const { description, name } = req.body;

  if (name.length > 50)
    res.status(400).json("Name must not exceed 50 characters");
  if (description.length > 160)
    res.status(400).json("Description must not exceed 160 characters");

  const text = `
  UPDATE users
  SET description=$1, name=$2
  WHERE username=$3
  RETURNING *;`;

  query(text, [description, name, req.params.username], (error, result) => {
    if (error) return res.json(error);
    if (!result.rows.length)
      return res.status(400).json("Something went wrong");
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
    if (error) return res.json(error);
    if (!result.rows.length || !result.rows[0].count)
      return res.status(400).json("Something went wrong");
    res.send(result.rows[0].count);
  });
});

users.get("/:user_id/followers", (req, res) => {
  const text = `
  SELECT COUNT(*)
  FROM user_following
  WHERE following_id=$1;`;

  query(text, [req.params.user_id], (error, result) => {
    if (error) return res.json(error);
    if (!result.rows.length || !result.rows[0].count)
      return res.status(400).json("Something went wrong");
    res.send(result.rows[0].count);
  });
});

export default users;
