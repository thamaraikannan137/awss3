const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3Controller = require('../controllers/s3.controller');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Upload file route
router.post('/upload', upload.single('file'), s3Controller.uploadFile);

// List all files route
router.get('/files', s3Controller.listFiles);

// Get specific file route
router.get('/files/:key', s3Controller.getFile);

// Delete file route
router.delete('/files/:key', s3Controller.deleteFile);

module.exports = router; 