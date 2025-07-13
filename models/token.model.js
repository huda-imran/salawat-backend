const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    tokenId: String,
    name: String,
    symbol: String,
    value: Number,
    verificationCount: Number,
    issuedDate: Date,
    burnDate: Date,
    verifiedStatus: String,
    owner: String
});

module.exports = mongoose.model('Token', TokenSchema);