const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/token.controller');

// THESE MUST BE DEFINED FUNCTIONS
router.post('/create', tokenController.createToken);
router.post('/mint', tokenController.mintToken);
router.post('/burn', tokenController.burnToken);
router.patch('/mark-complete/:tokenId', tokenController.markTokenComplete);
router.delete('/request/:requestId', tokenController.deleteTokenCountRequest);
router.get('/requests', tokenController.getAllTokenCountRequests);
router.get('/:id', tokenController.getTokenById);
router.get('/', tokenController.getAllTokens);

module.exports = router;