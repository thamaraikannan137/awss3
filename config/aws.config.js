const { S3Client } = require('@aws-sdk/client-s3');

// Configure AWS S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    endpoint: `https://s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`,
    forcePathStyle: true // This is important for some regions
});

module.exports = {
    s3Client
}; 