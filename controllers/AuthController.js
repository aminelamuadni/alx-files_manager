const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    const user = await dbClient.db.collection('users').findOne({
      email,
      password: sha1(password),
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token || !await redisClient.get(`auth_${token}`)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await redisClient.del(`auth_${token}`);
    return res.status(204).send();
  }
}

module.exports = AuthController;
