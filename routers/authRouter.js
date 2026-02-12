const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/authController');

authRouter.post('/signup-submit', authController.signup);
authRouter.post('/login-submit', authController.login); 

module.exports = authRouter;