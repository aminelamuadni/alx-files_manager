const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');

const fileQueue = new Bull('fileQueue', { redis: { port: 6379, host: '127.0.0.1' } });

fileQueue.process(async (job) => {
  const { userId, fileId, filePath } = job.data;
  if (!fileId || !userId) throw new Error('Missing fileId or userId');

  const sizes = [100, 250, 500];
  sizes.forEach(async (size) => {
    const options = { width: size };
    try {
      const thumbnail = await imageThumbnail(filePath, options);
      const thumbnailPath = `${filePath}_${size}`;
      fs.writeFileSync(thumbnailPath, thumbnail);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
    }
  });
});

console.log('Worker started');
