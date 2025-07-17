const express = require('express');
const router = express.Router();
const builderController = require('../controllers/builder.controller');

router.post('/create', builderController.createBuilder);
router.put('/update/:username', builderController.updateBuilder);
router.delete('/delete/:username', builderController.deleteBuilder);
router.get('/all/:username', builderController.getAllBuilders);
router.get('/communities/:username', builderController.getCommunities);
router.get('/members/:username', builderController.getRegisteredMembers);
router.post('/create-community', builderController.createCommunity);
router.get('/:username', builderController.getBuilderByUsername);

module.exports = router;