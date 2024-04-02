import { createClient } from "@supabase/supabase-js";
import { Response } from "express";

export const supabase = createClient(
  process.env["SUPABASE_URL"] ?? "",
  process.env["SUPABASE_KEY"] ?? ""
);

export const uploadImage = async (file: Express.Multer.File) => {
  const response = await supabase.storage
    .from("twitter-clone")
    .upload(file.originalname, file.buffer, {
      contentType: file.mimetype,
    });
  return response;
};

export const getImage = async (fileKey: string, res: Response) => {
  const { data, error } = await supabase.storage
    .from("twitter-clone")
    .download(fileKey);

  if (error) {
    res.write(Buffer.from([]), "binary");
    res.end(null, "binary");
  }

  if (data) {
    data.arrayBuffer().then((buffer) => {
      const buff = Buffer.from(buffer);
      res.write(buff, "binary");
      res.end(null, "binary");
    });
  }
};
