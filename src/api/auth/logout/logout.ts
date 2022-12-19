import { Router } from "express";

const logout = Router();

logout.get("/", (req, res) => {
  res
    .clearCookie("access_token", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .json("User has been logged out.");
});

export default logout;
