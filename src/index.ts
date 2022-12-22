import express, { Request, Response } from "express";
import cors from "cors";
import api from "./api/api";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 8080;

app.use(
  cors({
    origin: ["http://localhost:4200", "http://192.168.254.32:4200"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api", api);

app.get("/", (request: Request, response: Response) => {
  response.send({ message: "hello from home" });
});

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
