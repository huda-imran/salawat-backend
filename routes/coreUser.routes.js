// routes/core.routes.js
const express = require('express');
const router = express.Router();
const coreController = require('../controllers/coreUser.controller');

router.post('/create', coreController.createCoreMember);
router.put('/update/:username', coreController.updateCoreMember);
router.delete('/delete/:username', coreController.deleteCoreMember);
router.get('/', coreController.getAllCoreMembers);
router.get('/:username', coreController.getCoreMemberByUsername);

module.exports = router;