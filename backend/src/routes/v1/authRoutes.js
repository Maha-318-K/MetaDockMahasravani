const express = require('express');
const router = express.Router();
const { login, forgotPassword } = require('../../controllers/authController');

// Route: /api/v1/auth/login
router.post('/login', login);

// Route: /api/v1/auth/forgot-password
router.post('/forgot-password', forgotPassword);

module.exports = router;
