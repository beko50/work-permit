const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validateInput');
const authMiddleware = require('../middleware/authMiddleware');

// Group related routes with comments
// Authentication routes
router.post('/register', validateRegisterInput, userController.register);
router.post('/login', validateLoginInput, userController.login);

// Protected routes
router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router;