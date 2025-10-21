// backend/middleware/activityLogger.js
const ActivityLog = require('../models/ActivityLog');

const activityLogger = (req, res, next) => {
  // Listen for the 'finish' event, which is emitted when the response is sent
  res.on('finish', async () => {
    // logData will be attached to res.locals by individual routes
    if (res.locals.logData) {
      const { actionType, filename } = res.locals.logData;
      const userId = req.user ? req.user.id : null;

      // Don't log if there's no associated user
      if (!userId) return;

      const log = new ActivityLog({
        owner: userId,
        actionType,
        filename,
        status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      await log.save();
    }
  });

  next();
};

module.exports = activityLogger;