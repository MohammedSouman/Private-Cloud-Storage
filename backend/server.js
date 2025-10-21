const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();
const activityLogger = require('./middleware/activityLogger');

const app = express();

// Connect Database
connectDB();

// Init Middleware
// Allow requests from our frontend
app.use(cors({
  exposedHeaders: ['x-file-iv', 'x-file-salt', 'x-original-filename'],
}));
app.use(express.json({ extended: false })); // Allows us to accept JSON data in the body

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
// IMPORTANT: Use the logger middleware AFTER auth routes but BEFORE file/analytics routes
// to ensure req.user is available.
app.use('/api/auth', require('./routes/auth'));
app.use(activityLogger);

app.use('/api/files', require('./routes/files'));
app.use('/api/analytics', require('./routes/analytics'));

// This is a placeholder for a protected route to test our middleware
const authMiddleware = require('./middleware/authMiddleware');
app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ msg: 'Welcome! This is a protected route.', user: req.user });
});


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));