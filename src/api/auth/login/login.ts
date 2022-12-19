import { compareSync } from "bcryptjs";
import { Router } from "express";
import { query } from "../../../db";
import jwt from "jsonwebtoken";

const login = Router();

login.post("/", (req, res) => {
  const text = `SELECT * FROM users WHERE email = $1`;

  query(text, [req.body.email], (error, result) => {
    if (error) return res.json(error);
    if (!result.rows.length)
      return res
        .status(404)
        .json("A user was not found with that email address.");

    const { password, ...user } = result.rows[0];

    const passwordCorrect = compareSync(
      req.body.password,
      result.rows[0].password
    );

    if (!passwordCorrect) return res.status(401).json("Incorrect password");
    const token = jwt.sign(user, "jwtkey");
    res
      .cookie("access_token", token, {
        httpOnly: true,
      })
      .status(200)
      .json(user);
  });
});

export default login;
