const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/authMiddleware');
const cronAuth = require('../middleware/cronAuth');
const File = require('../models/File');
const { uploadFileToS3, downloadFileFromS3, deleteObjectFromS3 } = require('../services/s3Service');

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST api/files/upload
// @desc    Upload an encrypted file
// @access  Private
router.post('/upload', [auth, upload.single('file')], async (req, res) => {
  try {
    const { originalFilename, salt, iv } = req.body;
    const fileBuffer = req.file.buffer;
    const userId = req.user.id;

    const s3Key = `${userId}/${uuidv4()}`;
    await uploadFileToS3(fileBuffer, s3Key, req.file.mimetype);

    const newFile = new File({
      owner: userId,
      originalFilename,
      s3Key,
      mimetype: req.file.mimetype,
      size: req.file.size,
      salt,
      iv,
    });

    await newFile.save();
    
    // Tell the logger what happened
    res.locals.logData = { actionType: 'upload', filename: newFile.originalFilename };
    res.status(201).json(newFile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files
// @desc    Get all ACTIVE files for a user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const files = await File.find({ owner: req.user.id, isDeleted: { $ne: true } }).sort({ uploadDate: -1 });
        res.json(files);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/files/download/:id
// @desc    Download or View an encrypted file
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file || file.owner.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'File not found or unauthorized' });
        }
        
        // Distinguish between view and download for logging
        const isViewAction = req.query.action === 'view';
        res.locals.logData = { 
          actionType: isViewAction ? 'view' : 'download', 
          filename: file.originalFilename 
        };

        const encryptedFileBuffer = await downloadFileFromS3(file.s3Key);

        file.lastAccessed = Date.now();
        await file.save();

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('x-file-iv', file.iv);
        res.setHeader('x-file-salt', file.salt);
        res.setHeader('x-original-filename', encodeURIComponent(file.originalFilename));
        
        res.send(encryptedFileBuffer);

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


// --- TRASH MANAGEMENT ROUTES ---

// @route   DELETE api/files/:id
// @desc    Soft delete a file (move to trash)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    res.locals.logData = { actionType: 'delete', filename: file.originalFilename };

    file.isDeleted = true;
    file.deletedAt = Date.now();
    await file.save();

    res.json({ msg: 'File moved to trash' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/files/trash
// @desc    Get all files in the trash
// @access  Private
router.get('/trash', auth, async (req, res) => {
  try {
    const trashedFiles = await File.find({ owner: req.user.id, isDeleted: true }).sort({ deletedAt: -1 });
    res.json(trashedFiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/files/restore/:id
// @desc    Restore a file from the trash
// @access  Private
router.post('/restore/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ msg: 'File not found in trash' });
    }

    res.locals.logData = { actionType: 'restore', filename: file.originalFilename };

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json(file);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/files/permanent/:id
// @desc    Permanently delete a file
// @access  Private
router.delete('/permanent/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.user.id });
    if (!file) {
      return res.status(404).json({ msg: 'File not found' });
    }

    res.locals.logData = { actionType: 'permanent_delete', filename: file.originalFilename };

    await deleteObjectFromS3(file.s3Key);
    await File.findByIdAndDelete(req.params.id);

    res.json({ msg: 'File permanently deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- AUTOMATED CLEANUP ROUTE ---

// @route   DELETE api/files/cleanup/expired
// @desc    Permanently delete all files in trash for over 30 days
// @access  Protected by Cron Secret
router.delete('/cleanup/expired', cronAuth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const expiredFiles = await File.find({
      isDeleted: true,
      deletedAt: { $lte: thirtyDaysAgo },
    });

    if (expiredFiles.length === 0) {
      return res.json({ msg: 'No expired files to clean up.' });
    }

    for (const file of expiredFiles) {
      await deleteObjectFromS3(file.s3Key);
      await File.findByIdAndDelete(file._id);
    }
    
    console.log(`CRON JOB: Cleaned up ${expiredFiles.length} expired files.`);
    res.json({ msg: `Successfully deleted ${expiredFiles.length} expired files.` });
    
  } catch (err) {
    console.error('Cron cleanup failed:', err.message);
    res.status(500).send('Server Error during cron cleanup');
  }
});


module.exports = router;