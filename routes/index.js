const express = require('express');

const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

// Define routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New user registration route
router.post('/users', UsersController.postNew);

module.exports = router;
