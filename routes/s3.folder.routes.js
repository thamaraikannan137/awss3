const express = require('express');
const router = express.Router();
const multer = require('multer');
const s3FolderController = require('../controllers/s3.folder.controller');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Upload file to specific folder
router.post('/upload', upload.single('file'), s3FolderController.uploadFileToFolder);

// List files in specific folder
router.get('/list', s3FolderController.listFilesInFolder);

// Get file from specific folder - using a more specific route pattern
router.get('/file/:folder/:subfolder/:filename', s3FolderController.getFileFromFolder);

// Delete file from specific folder - using a more specific route pattern
router.delete('/file/:folder/:subfolder/:filename', s3FolderController.deleteFileFromFolder);

// Create new folder
router.post('/folder', s3FolderController.createFolder);

module.exports = router; 