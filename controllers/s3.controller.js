const { s3Client } = require('../config/aws.config');
const { 
    PutObjectCommand, 
    ListObjectsV2Command, 
    DeleteObjectCommand, 
    GetObjectCommand 
} = require('@aws-sdk/client-s3');

class S3Controller {
    // Upload file to S3
    async uploadFile(req, res) {
        try {
            const { file } = req;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const key = `${Date.now()}-${file.originalname}`;
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
                fileUrl
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // List all files in bucket
    async listFiles(req, res) {
        try {
            console.log("process.env.S3_BUCKET_NAME", process.env.S3_BUCKET_NAME);
            const command = new ListObjectsV2Command({
                Bucket: process.env.S3_BUCKET_NAME
            });

            const data = await s3Client.send(command);
            console.log("data", data);
            res.json({
                files: data.Contents.map(file => ({
                    key: file.Key,
                    size: file.Size,
                    lastModified: file.LastModified,
                    url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`
                }))
            });
        } catch (error) {
            console.log("error", error);    
            res.status(500).json({ error: error.message });
        }
    }

    // Delete file from S3
    async deleteFile(req, res) {
        try {
            const { key } = req.params;
            const command = new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key
            });

            await s3Client.send(command);
            res.json({ message: 'File deleted successfully' });
        } catch (error) {
            console.error('Delete error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get file from S3
    async getFile(req, res) {
        try {
            const { key } = req.params;
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
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new S3Controller(); 