const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const File = require('../models/File');
const ActivityLog = require('../models/ActivityLog');
const mongoose = require('mongoose');

// --- ACTIVITY LOGS ---
router.get('/logs', auth, async (req, res) => {
  try {
    const { limit = 50, page = 1, action, search } = req.query;
    const query = { owner: req.user.id };

    if (action) query.actionType = action;
    if (search) query.filename = { $regex: search, $options: 'i' };

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((page - 1) * limit);
    
    const total = await ActivityLog.countDocuments(query);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// --- AI & STORAGE OPTIMIZATION ---

// @route   GET api/analytics/storage-summary
router.get('/storage-summary', auth, async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await File.aggregate([
      { $match: { owner: ownerId, isDeleted: { $ne: true } } },
      { $group: { _id: null, totalSize: { $sum: '$size' }, totalFiles: { $sum: 1 } } }
    ]);
    res.json(stats[0] || { totalSize: 0, totalFiles: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/analytics/duplicates
router.get('/duplicates', auth, async (req, res) => {
    try {
        const ownerId = new mongoose.Types.ObjectId(req.user.id);
        const duplicates = await File.aggregate([
            { $match: { owner: ownerId, isDeleted: { $ne: true } } },
            {
              $group: {
                // <-- THIS IS THE CHANGE
                _id: { contentHash: '$contentHash' }, // Group by the file's actual content hash
                docs: { $push: '$$ROOT' },
                count: { $sum: 1 }
              }
            },
            { $match: { count: { $gt: 1 } } },
            { $sort: { 'docs.uploadDate': 1 } } // Sort by the upload date of the files within the group
        ]);
        res.json(duplicates);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});


// @route   GET api/analytics/usage-stats
router.get('/usage-stats', auth, async (req, res) => {
    try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const coldFiles = await File.find({
            owner: req.user.id,
            isDeleted: { $ne: true },
            lastAccessed: { $lte: ninetyDaysAgo }
        }).sort({ lastAccessed: 1 }).limit(10);
        
        const hotFiles = await File.find({
            owner: req.user.id,
            isDeleted: { $ne: true },
        }).sort({ lastAccessed: -1 }).limit(10);
        res.json({ hotFiles, coldFiles });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});


// @route   GET api/analytics/categories
router.get('/categories', auth, async (req, res) => {
    try {
        const ownerId = new mongoose.Types.ObjectId(req.user.id);
        const categories = await File.aggregate([
            { $match: { owner: ownerId, isDeleted: { $ne: true } } },
            {
                $project: {
                    size: 1,
                    category: {
                        $switch: {
                            branches: [
                                { case: { $in: ['$mimetype', ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv']] }, then: 'Documents' },
                                { case: { $in: ['$mimetype', ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']] }, then: 'Images' },
                                { case: { $in: ['$mimetype', ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']] }, then: 'Videos' },
                                { case: { $in: ['$mimetype', ['audio/mpeg', 'audio/wav', 'audio/ogg']] }, then: 'Audio' },
                                { case: { $in: ['$mimetype', ['application/zip', 'application/x-rar-compressed', 'application/gzip']] }, then: 'Archives' }
                            ],
                            default: 'Other'
                        }
                    }
                }
            },
            { $group: {
                _id: '$category',
                totalSize: { $sum: '$size' },
                count: { $sum: 1 }
            }}
        ]);
        res.json(categories);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

// @route   GET api/analytics/large-files
router.get('/large-files', auth, async (req, res) => {
    try {
        const largeFiles = await File.find({
            owner: req.user.id,
            isDeleted: { $ne: true },
            size: { $gt: 10 * 1024 * 1024 } // 10 MB
        }).sort({ size: -1 });
        res.json(largeFiles);
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});


module.exports = router;