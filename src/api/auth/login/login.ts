import { compareSync } from "bcryptjs";
import { Router } from "express";
import { query } from "../../../db";
import jwt from "jsonwebtoken";

const login = Router();

login.post("/", (req, res) => {
  const text = `SELECT * FROM users WHERE email = $1`;

  query(text, [req.body.email], (error, result) => {
    if (error) return res.json(error);
    if (!result)
      return res
        .status(400)
        .send({ message: "Could not connect to SQL client" });
    if (!result.rows.length)
      return res
        .status(404)
        .send({ message: "A user was not found with that email address." });

    const { password, ...user } = result.rows[0];

    const passwordCorrect = compareSync(
      req.body.password,
      result.rows[0].password
    );

    if (!passwordCorrect)
      return res.status(401).send({ message: "Incorrect password" });
    const token = jwt.sign(user, process.env["JWTKEY"] ?? "");
    const oneMonthInMs = 1000 * 86400 * 30;
    return res
      .cookie("access_token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        expires: new Date(Date.now() + oneMonthInMs),
      })
      .status(200)
      .send(user);
  });
});

export default login;
