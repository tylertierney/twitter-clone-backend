import express, { Request, Response } from "express";
import cors from "cors";
import api from "./api/api";
import cookieParser from "cookie-parser";
import https from "http";
import fs from "fs";
import path from "path";
import util from "util";

const app = express();
const PORT = (process.env["PORT"] as number | undefined) || 8080;

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

//HTTP
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started at http://localhost:${PORT}`);
});

//HTTPS

// console.log(path.join(__dirname, "cert", "key.pem"));
// const sslServer = https.createServer(
//   {
//     key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem")),
//   } as https.ServerOptions,
//   app
// );

// sslServer.listen(PORT, () => console.log(`Secure server on port ${PORT}`));
