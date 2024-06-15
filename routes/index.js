const express = require('express');

const router = express.Router();
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

// Define routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// New user registration route
router.post('/users', UsersController.postNew);

// Authentication routes
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersController.getMe);

router.post('/files', FilesController.postUpload);

module.exports = router;
