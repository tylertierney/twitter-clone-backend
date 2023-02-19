import express, { Request, Response } from "express";
import cors from "cors";
import api from "./api/api";
import cookieParser from "cookie-parser";
import https from "http";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 8080;

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://localhost:4200",
      "http://192.168.254.32:4200",
      "https://192.168.254.32:4200",
      "https://playful-meerkat-6d44db.netlify.app",
    ],
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

// const sslServer = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
//   },
//   app
// );

// sslServer.listen(PORT, () => console.log(`Secure server on port ${PORT}`));
