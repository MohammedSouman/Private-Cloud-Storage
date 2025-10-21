// backend/middleware/cronAuth.js
require('dotenv').config();

const cronAuth = (req, res, next) => {
  const providedKey = req.header('x-cron-secret');

  if (!providedKey || providedKey !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ msg: 'Unauthorized: Invalid or missing secret key' });
  }

  next();
};

module.exports = cronAuth;