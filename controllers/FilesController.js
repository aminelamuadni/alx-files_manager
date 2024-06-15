const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const Bull = require('bull');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const fileQueue = new Bull('fileQueue', { redis: { port: 6379, host: '127.0.0.1' } });

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (['file', 'image'].includes(type) && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== '0') {
      const parent = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = uuidv4();
    const filePath = path.join(folderPath, filename);
    if (type === 'file' || type === 'image') {
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    }

    const newFile = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId !== '0' ? new ObjectId(parentId) : '0',
      localPath: type === 'folder' ? '' : filePath,
    };

    const result = await dbClient.db.collection('files').insertOne(newFile);

    // If the file is an image, enqueue a job to generate thumbnails
    if (type === 'image') {
      fileQueue.add({
        userId: userId.toString(),
        fileId: result.insertedId.toString(),
        filePath,
      });
    }

    return res.status(201).json({
      id: result.insertedId.toString(),
      ...newFile,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(userId),
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page || '0', 10);
    const limit = 20;

    const files = await dbClient.db.collection('files').find({
      userId: new ObjectId(userId),
      parentId: parentId !== '0' ? new ObjectId(parentId) : '0',
    }).skip(page * limit).limit(limit)
      .toArray();

    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: true } },
      { returnOriginal: false },
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: new ObjectId(req.params.id), userId: new ObjectId(userId) },
      { $set: { isPublic: false } },
      { returnOriginal: false },
    );

    if (!file.value) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file.value);
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    const { size } = req.query; // This will be used to fetch specific thumbnail sizes
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    // Verify the user is authenticated and authorized to access the file
    const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    if (!file.isPublic && (!userId || file.userId.toString() !== userId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Append the requested size to the filename if a specific size is requested
    let filePath = file.localPath;
    if (size && ['100', '250', '500'].includes(size)) {
      filePath = `${filePath}_${size}`;
    }

    // Check if the file (or its thumbnail) exists locally
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Serve the file with the appropriate MIME type
    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    const readStream = fs.createReadStream(filePath);
    readStream.on('error', () => res.status(500).json({ error: 'Error reading file' }));
    readStream.pipe(res);
    return res;
  }
}

module.exports = FilesController;
