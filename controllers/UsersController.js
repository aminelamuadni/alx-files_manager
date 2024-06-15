const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if email already exists
    const userExists = await dbClient.db.collection('users').findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash password
    const hashedPassword = sha1(password);

    // Create new user
    const newUser = {
      email,
      password: hashedPassword,
    };
    const result = await dbClient.db.collection('users').insertOne(newUser);

    // Return new user info
    return res.status(201).json({ id: result.insertedId, email: newUser.email });
  }
}

module.exports = UsersController;
