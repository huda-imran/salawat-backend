const mongoose = require('mongoose');

const TokenCountRequestSchema = new mongoose.Schema({
    memberUsername: { type: String, required: true },
    memberAddress: { type: String, required: true },
    tokenId: { type: String, required: true },
    count: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TokenCountRequest', TokenCountRequestSchema);