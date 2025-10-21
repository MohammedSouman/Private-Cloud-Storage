// backend/services/s3Service.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to S3.
 * @param {Buffer} fileBuffer - The file content as a buffer.
 * @param {string} filename - The name of the file to be stored in S3.
 * @param {string} mimetype - The MIME type of the file.
 * @returns {Promise<object>} - The result from the S3 PutObjectCommand.
 */
exports.uploadFileToS3 = (fileBuffer, filename, mimetype) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: fileBuffer,
    ContentType: mimetype,
  };
  const command = new PutObjectCommand(params);
  return s3Client.send(command);
};


/**
 * Downloads a file from S3.
 * @param {string} s3Key - The key of the file in the S3 bucket.
 * @returns {Promise<Buffer>} - A promise that resolves to the file content as a Buffer.
 */
exports.downloadFileFromS3 = async (s3Key) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
    };
    const command = new GetObjectCommand(params);
    const { Body } = await s3Client.send(command);
    
    // Convert the stream to a buffer
    return new Promise((resolve, reject) => {
        const chunks = [];
        Body.on('data', chunk => chunks.push(chunk));
        Body.on('error', reject);
        Body.on('end', () => resolve(Buffer.concat(chunks)));
    });
};

/**
 * Deletes a file from S3.
 * @param {string} s3Key - The key of the file in the S3 bucket.
 * @returns {Promise<object>} - The result from the S3 DeleteObjectCommand.
 */
exports.deleteObjectFromS3 = (s3Key) => { // <-- ADD THIS ENTIRE FUNCTION
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: s3Key,
  };
  const command = new DeleteObjectCommand(params);
  return s3Client.send(command);
};