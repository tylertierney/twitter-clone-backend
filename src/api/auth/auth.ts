import { Request, Router } from "express";
import { query } from "../../db";
import { hashSync, genSaltSync } from "bcryptjs";
import jwt from "jsonwebtoken";
import login from "./login/login";
import logout from "./logout/logout";
import * as EmailValidator from "email-validator";

const auth = Router();

auth.use("/logout", logout);
auth.use("/login", login);

auth.get("/", (req, res) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(200).json(false);
  } else {
    try {
      const data = jwt.verify(token, process.env["JWTKEY"] ?? "");
      if (data) {
        const decoded = jwt.decode(token, { json: true });
        return res.send(decoded);
      }
    } catch {
      return res.status(401).json("Unauthorized");
    }
    return res.status(401).json("Unauthorized");
  }
});

const getErrorsFromUsername = (username: string): string | null => {
  if (!username?.length) {
    return "Username is required";
  }

  if (username.length < 4 || username.length > 15) {
    return "Username must be 4-15 characters";
  }

  const regex = /^[a-zA-Z0-9_]+$/;
  if (!regex.test(username)) {
    return "Username may only contain alphanumeric characters and underscores";
  }

  return null;
};

const getErrorsFromName = (name: string): string | null => {
  if (!name?.length) {
    return "Name is required";
  }

  if (name.length > 50) {
    return "Name may not exceed 50 characters";
  }

  return null;
};

const getErrorsFromPassword = (password: string): string | null => {
  if (!password?.length) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be 8 characters minimum";
  }

  return null;
};

auth.post("/register", (req, res) => {
  const username = req.body.username;
  const usernameError = getErrorsFromUsername(username);
  if (usernameError) {
    return res.status(400).send(usernameError);
  }

  const name = req.body.name;
  const nameError = getErrorsFromName(name);
  if (nameError) {
    return res.status(400).send(nameError);
  }

  const email = req.body.email;
  if (!EmailValidator.validate(email)) {
    return res.status(400).send(`Provide a valid email`);
  }

  const password = req.body.password;
  const passwordError = getErrorsFromPassword(password);
  if (passwordError) {
    return res.status(400).send(passwordError);
  }

  const text = `
    SELECT * FROM users 
    WHERE users.email = $1 
    OR 
    users.username = $2;
  `;

  return query(text, [req.body.email, req.body.username], (error, result) => {
    if (error) return res.json(error);
    if (result.rows.length) return res.status(409).send("User already exists");

    const profilePics = [
      "coral",
      "bluejeans",
      "aeroblue",
      "pastelpink",
      "lightblue",
      "lightgreen",
      "mediumslateblue",
      "deepskyblue",
      "plum",
    ];

    const profile_pic = profilePics[~~(Math.random() * profilePics.length)];

    const salt = genSaltSync(10);
    const hash = hashSync(req.body.password, salt);

    const queryText = `
      INSERT INTO users (name, username, email, password, profile_pic)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    return query(
      queryText,
      [req.body.name, req.body.username, req.body.email, hash, profile_pic],
      (error, result) => {
        if (error) {
          return res.status(500).json(error);
        }
        if (!result)
          return res
            .status(500)
            .json({ message: "Unable to connect to SQL client" });
        if (!result.rows.length) return res.json("Something went wrong");
        const { password, ...user } = result.rows[0];
        const token = jwt.sign(user, process.env["JWTKEY"] ?? "");
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
  if (!req.body.username)
    return res.status(400).send({ message: "Username already taken" });

  const text = `
  SELECT * FROM users 
  WHERE users.username = $1;`;

  return query(text, [req.body.username], (error, result) => {
    if (error) return res.status(500).send(error);
    if (!result)
      return res
        .status(500)
        .json({ message: "Unable to connect to SQL client" });
    if (result.rows.length) return res.status(200).send({ isAvailable: false });
    return res.status(200).send({ isAvailable: true });
  });
});

auth.post("/check-email-available", (req, res) => {
  if (!req.body.email) return res.status(400);

  const text = `
    SELECT * FROM users 
    WHERE users.email = $1;
  `;

  return query(text, [req.body.email], (error, result) => {
    if (error) return res.status(400).send(error);
    if (!result)
      return res
        .status(400)
        .json({ message: "Unable to connect to SQL client" });
    if (result.rows.length) return res.status(200).send({ isAvailable: false });
    return res.status(200).send({ isAvailable: true });
  });
});

export default auth;
