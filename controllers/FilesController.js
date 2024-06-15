const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

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
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parent = null;
    if (parentId !== '0') {
      parent = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parent) return res.status(400).json({ error: 'Parent not found' });
      if (parent.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileDocument = {
      userId: new ObjectId(userId),
      name,
      type,
      parentId,
      isPublic,
      localPath: '',
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
      const filename = uuidv4();
      const filePath = path.join(folderPath, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      fileDocument.localPath = filePath;
    }

    const result = await dbClient.db.collection('files').insertOne(fileDocument);
    return res.status(201).json({
      id: result.insertedId,
      userId: fileDocument.userId.toString(),
      name: fileDocument.name,
      type: fileDocument.type,
      parentId: fileDocument.parentId,
      isPublic: fileDocument.isPublic,
    });
  }
}

module.exports = FilesController;
