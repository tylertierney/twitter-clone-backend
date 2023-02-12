import fs from "fs";
import S3 from "aws-sdk/clients/s3";

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

// export const bucketParams = {
//   Bucket: "twitter-clone-1",
//   // Specify the name of the new object. For example, 'index.html'.
//   // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
//   Key: "someNewBucketObjectKey",
//   // Content of the new object.
//   Body: "BODY",
// };

export const uploadFile = (file: Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Body: fileStream,
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
};

export const getFileStream = (fileKey: string) => {
  const downloadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  };

  // console.log(s3.getObject(downloadParams));
  return s3.getObject(downloadParams).createReadStream();
};
