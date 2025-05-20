require('dotenv').config();
const express = require('express');
const cors = require('cors');
const s3Routes = require('./routes/s3.routes');
const s3FolderRoutes = require('./routes/s3.folder.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/s3', s3Routes);
app.use('/api/s3/folder', s3FolderRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});