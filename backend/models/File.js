// backend/models/File.js
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalFilename: {
    type: String,
    required: true,
  },
  s3Key: { // The key/filename in the S3 bucket
    type: String,
    required: true,
  },
  mimetype: { 
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  iv: { // Initialization Vector for AES-GCM (Base64)
    type: String,
    required: true,
  },
  salt: { // Salt for PBKDF2 (Base64)
    type: String,
    required: true,
  },
  contentHash: { 
    type: String,
    required: true,
    index: true, // Speeds up queries on this field
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('File', FileSchema);