import fs from "fs";
import S3, { PutObjectRequest } from "aws-sdk/clients/s3";

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

export const uploadFile = (file: Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);
  const uploadParams: PutObjectRequest = {
    Body: fileStream,
    Bucket: process.env.AWS_BUCKET_NAME ?? "",
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
};

export const getFileStream = (fileKey: string) => {
  const downloadParams: PutObjectRequest = {
    Bucket: process.env.AWS_BUCKET_NAME ?? "",
    Key: fileKey,
  };

  return s3.getObject(downloadParams).createReadStream();
};
