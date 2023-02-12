import { Router } from "express";
import auth from "./auth/auth";
import posts from "./posts/posts";
import users from "./users/users";
import follow from "./follow/follow";
import search from "./search/search";
import tags from "./tags/tags";

const api = Router();

api.use("/follow", follow);
api.use("/auth", auth);
api.use("/posts", posts);
api.use("/users", users);
api.use("/search", search);
api.use("/tags", tags);

api.get("/", (req, res) => {
  res.json("hi");
});

export default api;
