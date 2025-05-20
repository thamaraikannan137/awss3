const { s3Client } = require('../config/aws.config');
const { 
    PutObjectCommand, 
    ListObjectsV2Command, 
    DeleteObjectCommand, 
    GetObjectCommand 
} = require('@aws-sdk/client-s3');

class S3FolderController {
    constructor() {
        // Bind methods to preserve 'this' context
        this.uploadFileToFolder = this.uploadFileToFolder.bind(this);
        this.listFilesInFolder = this.listFilesInFolder.bind(this);
        this.deleteFileFromFolder = this.deleteFileFromFolder.bind(this);
        this.getFileFromFolder = this.getFileFromFolder.bind(this);
        this.createFolder = this.createFolder.bind(this);
    }

    // Helper function to generate folder path
    generateFolderPath(folder, subfolder) {
        let path = '';
        if (folder) {
            path += `${folder}/`;
        }
        if (subfolder) {
            path += `${subfolder}/`;
        }
        return path;
    }

    // Upload file to specific folder in S3
    async uploadFileToFolder(req, res) {
        try {
            const { file } = req;
            const { folder, subfolder } = req.body;

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Validate file size (e.g., max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                return res.status(400).json({ error: 'File size exceeds 10MB limit' });
            }

            // Generate folder path
            const folderPath = this.generateFolderPath(folder, subfolder);
            const key = `${folderPath}${Date.now()}-${file.originalname}`;

            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await s3Client.send(command);
            const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            
            res.json({
                message: 'File uploaded successfully',
                fileUrl,
                folder: folder || 'root',
                subfolder: subfolder || 'none',
                key
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // List files in specific folder
    async listFilesInFolder(req, res) {
        try {
            const { folder, subfolder } = req.query;
            const prefix = this.generateFolderPath(folder, subfolder);

            const command = new ListObjectsV2Command({
                Bucket: process.env.S3_BUCKET_NAME,
                Prefix: prefix,
                Delimiter: '/' // This helps in getting folder structure
            });

            const data = await s3Client.send(command);
            
            // Get files
            const files = data.Contents ? data.Contents.map(file => ({
                key: file.Key,
                size: file.Size,
                lastModified: file.LastModified,
                url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`
            })) : [];

            // Get folders (CommonPrefixes)
            const folders = data.CommonPrefixes ? data.CommonPrefixes.map(prefix => ({
                name: prefix.Prefix.replace(prefix, '').replace('/', ''),
                path: prefix.Prefix
            })) : [];

            res.json({
                currentPath: prefix || 'root',
                files,
                folders
            });
        } catch (error) {
            console.error('List files error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Delete file from specific folder
    async deleteFileFromFolder(req, res) {
        try {
            const { folder, subfolder, filename } = req.params;

            // Validate parameters
            if (!folder || !subfolder || !filename) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Construct the key from the parameters
            const key = `${folder}/${subfolder}/${filename}`;
            console.log('Deleting file:', key);
            
            const command = new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key
            });

            await s3Client.send(command);
            res.json({ 
                message: 'File deleted successfully',
                deletedKey: key
            });
        } catch (error) {
            console.error('Delete error:', error);
            if (error.name === 'NoSuchKey') {
                return res.status(404).json({ error: 'File not found' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    // Get file from specific folder
    async getFileFromFolder(req, res) {
        try {
            const { folder, subfolder, filename } = req.params;

            // Validate parameters
            if (!folder || !subfolder || !filename) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            // Construct the key from the parameters
            const key = `${folder}/${subfolder}/${filename}`;
            console.log('Requested file path:', key);

            const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key
            });

            const data = await s3Client.send(command);
            
            // Convert the stream to buffer
            const chunks = [];
            for await (const chunk of data.Body) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            // Set appropriate headers
            res.setHeader('Content-Type', data.ContentType);
            res.setHeader('Content-Length', data.ContentLength);
            res.setHeader('ETag', data.ETag);
            res.setHeader('Last-Modified', data.LastModified);

            // Send the file
            res.send(buffer);
        } catch (error) {
            console.error('Get file error:', error);
            if (error.name === 'NoSuchKey') {
                return res.status(404).json({ error: 'File not found' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    // Create a new folder
    async createFolder(req, res) {
        try {
            const { folder, subfolder } = req.body;
            const folderPath = this.generateFolderPath(folder, subfolder);

            // In S3, folders are created by uploading an empty object with a trailing slash
            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `${folderPath}`,
                Body: ''
            });

            await s3Client.send(command);
            res.json({
                message: 'Folder created successfully',
                path: folderPath
            });
        } catch (error) {
            console.error('Create folder error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new S3FolderController(); 