import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const token = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Unauthorized");
  try {
    const data = jwt.verify(token, process.env["JWTKEY"] ?? "");
    if (data) return next();
  } catch {
    return res.status(401).json("Unauthorized");
  }
};
