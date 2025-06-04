const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');

// THESE MUST BE DEFINED FUNCTIONS
router.post('/mint', tokenController.mintToken);
router.post('/burn', tokenController.burnToken);
router.get('/:id', tokenController.getTokenById);
router.get('/', tokenController.getAllTokens);

module.exports = router;