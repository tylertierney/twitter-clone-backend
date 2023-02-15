import { Router } from "express";
import { query } from "../../db";
import { token } from "../../middlewares/token";

const follow = Router();

follow.use(token);

follow.post("/:user_id/:following_id", (req, res) => {
  if (req.body.action === "follow") {
    const text = `
  INSERT INTO user_following (user_id, following_id)
  VALUES ($1, $2);`;

    query(
      text,
      [req.params.user_id, req.params.following_id],
      (error, result) => {
        if (error) res.status(400).json("You already follow that user.");

        res.status(200).json("User followed!");
      }
    );
  } else {
    const text = `
    DELETE FROM user_following
    WHERE user_id=$1 AND following_id=$2;`;

    query(
      text,
      [req.params.user_id, req.params.following_id],
      (error, result) => {
        if (error) res.status(400).json("You don't follow that user.");

        res.status(200).json("User unfollowed");
      }
    );
  }
});

follow.get("/:user_id/:following_id", (req, res) => {
  const text = `
  SELECT * FROM user_following 
  WHERE user_id=$1 AND following_id=$2`;

  query(
    text,
    [req.params.user_id, req.params.following_id],
    (error, result) => {
      if (error) {
        res.status(200).json(error);
      }

      if (!result.rowCount) {
        res.status(200).json({ following: false });
      } else {
        res.status(200).json({ following: true });
      }
    }
  );
});

export default follow;
