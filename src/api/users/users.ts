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
  return query(text, [], (error, result) => {
    if (error) return res.status(400).send(error);
    if (result?.rows) {
      return res.send(result.rows);
    }
    return res.send(result);
  });
});

users.get("/:username/posts", (req, res) => {
  const text = `
    SELECT * FROM posts_view
    WHERE username=$1
    ORDER BY date DESC;
  `;

  return query(text, [req.params.username], (error, result) => {
    if (error) return res.status(500).json(error);
    if (!result.rows) return res.status(500).send("Something went wrong");
    return res.send(result.rows);
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

    return query(text, [data.path, req.params.username], (error, data) => {
      if (error) return res.status(500).json(error);

      if (!data.rows.length)
        return res.status(500).json("Something went wrong");

      const { password, ...user } = data.rows[0];

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

users.get("/:username/following", (req, res) => {
  const text = `
    SELECT u.username, u.name, u.description, u.profile_pic, u.id FROM users u
    JOIN user_following uf ON u.id=uf.following_id
    JOIN users u2 ON u2.id=uf.user_id
    WHERE u2.username=$1;
  `;

  return query(text, [req.params.username], (error, result) => {
    if (error) return res.status(500).json(error);
    if (!result?.rows) return res.status(500).send("Something went wrong");
    return res.send(result.rows);
  });
});

users.get("/:username/followers", (req, res) => {
  const text = `
    SELECT u.username, u.name, u.description, u.profile_pic, u.id FROM users u
    JOIN user_following uf ON u.id=uf.user_id
    JOIN users u2 ON u2.id=uf.following_id
    WHERE u2.username=$1;
  `;

  return query(text, [req.params.username], (error, result) => {
    if (error) return res.status(500).json(error);
    if (!result?.rows) return res.status(500).send("Something went wrong");
    return res.send(result.rows);
  });
});

users.delete("/:user_id", (req, res) => {
  const text = `
    DELETE FROM users
    WHERE id=$1
    RETURNING *;
  `;

  query(text, [req.params.user_id], (error, result) => {
    if (error) return res.json(error);
    if (!result.rows.length) {
      return res.status(500).json("Something went wrong");
    }
    return res.send(result.rows[0]);
  });
});

export default users;
