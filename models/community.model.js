// Community.js
const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
    communityId: String,
    name: String,
    builderWallet: String,
    isActive: { type: Boolean, default: true },
    memberCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Community', CommunitySchema);