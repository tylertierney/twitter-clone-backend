import { Router } from "express";
import { query } from "../../../db";

const like = Router();

like.post("/:post_id/:user_id", (req, res) => {
  const post_id = req.params.post_id;
  const user_id = req.params.user_id;

  const text = `
  SELECT * FROM likes
  WHERE post_id=$1
  AND user_id=$2;`;

  query(text, [post_id, user_id], (error, result) => {
    if (error) return res.status(400).json(error);

    if (result.rows.length) {
      const q = `
      DELETE FROM likes
      WHERE post_id=$1
      AND user_id=$2;`;

      query(q, [post_id, user_id], (err, data) => {
        if (error) return res.status(400).json(error);
        return res.status(200).json(false);
      });
    } else {
      const q = `
      INSERT INTO likes (post_id, user_id)
      VALUES ($1, $2);`;

      query(q, [post_id, user_id], (err, data) => {
        if (error) return res.status(400).json(error);
        return res.status(200).json(true);
      });
    }
  });
});

// like.get("/", (req, res) => {
//   const text = "SELECT * FROM likes;";

//   query(text, [], (err, result) => {
//     res.send(result.rows);
//   });
// });

like.get("/:post_id/:user_id", (req, res) => {
  const text = `
  SELECT * FROM likes
  WHERE post_id=$1
  AND user_id=$2;`;

  query(text, [req.params.post_id, req.params.user_id], (error, result) => {
    if (error) return res.json(false);

    if (result.rows.length) {
      return res.json(true);
    }
    return res.json(false);
  });
});

like.get("/:post_id/count", (req, res) => {
  const text = `
  SELECT COUNT(*)
  FROM likes
  WHERE post_id=$1`;

  query(text, [req.params.post_id], (error, result) => {
    res.send(result);
  });
});

export default like;
