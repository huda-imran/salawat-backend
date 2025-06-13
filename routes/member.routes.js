const express = require('express');
const router = express.Router();
const memberController = require('../controllers/member.controller');

// Create member
router.post('/create', memberController.createMember);

// Update member
router.put('/update/:username', memberController.updateMember);

// Delete member
router.delete('/delete', memberController.deleteMember);

// Get all members created by a builder
router.get('/by-builder/:builderUsername', memberController.getMembersByBuilder);

// Search member by identifier (username, email, or walletAddress)
router.post('/search', memberController.searchMember);

module.exports = router;