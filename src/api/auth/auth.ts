import { Router } from "express";
import { query } from "../../db";
import { hashSync, genSaltSync, compareSync } from "bcryptjs";
import jwt, { VerifyErrors } from "jsonwebtoken";
import login from "./login/login";
import logout from "./logout/logout";

const auth = Router();

auth.use("/logout", logout);
auth.use("/login", login);

auth.get("/", (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(200).json(false);

  jwt.verify(token, "jwtkey", (err: VerifyErrors | null) => {
    if (err) return res.status(200).json(false);

    const decoded = jwt.decode(token, { json: true });

    res.status(200).send(decoded);
  });

  res.status(200);
});

auth.post("/register", (req, res) => {
  const text = `
  SELECT * FROM users 
  WHERE users.email = $1 
  OR 
  users.username = $2;`;

  query(text, [req.body.email, req.body.username], (error, result) => {
    if (error) return res.json(error);
    if (result.rows.length) return res.status(409).send("User already exists");

    const salt = genSaltSync(10);
    const hash = hashSync(req.body.password, salt);

    const queryText = `
    INSERT INTO users (name, username, email, password, profile_pic)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;`;

    query(
      queryText,
      [
        req.body.name,
        req.body.username,
        req.body.email,
        hash,
        req.body.profile_pic,
      ],
      (error, result) => {
        if (error) {
          return res.json(error);
        }
        if (!result.rows.length) return res.json("Something went wrong");
        const { password, ...user } = result.rows[0];
        const token = jwt.sign(user, "jwtkey");
        return res
          .cookie("access_token", token, {
            httpOnly: true,
          })
          .status(200)
          .json(user);
      }
    );
  });
});

auth.post("/check-username-available", (req, res) => {
  if (!req.body.username) return res.status(400);

  const text = `
  SELECT * FROM users 
  WHERE users.username = $1;`;

  query(text, [req.body.username], (error, result) => {
    if (error) return res.status(400).send("Error during username lookup.");
    if (result.rows.length) return res.status(200).send({ isAvailable: false });
    return res.status(200).send({ isAvailable: true });
  });
});

auth.post("/check-email-available", (req, res) => {
  if (!req.body.email) return res.status(400);

  const text = `
  SELECT * FROM users 
  WHERE users.email = $1;`;

  query(text, [req.body.email], (error, result) => {
    if (error) return res.status(400).send("Error during account lookup.");
    if (result.rows.length) return res.status(200).send({ isAvailable: false });
    return res.status(200).send({ isAvailable: true });
  });
});

export default auth;
