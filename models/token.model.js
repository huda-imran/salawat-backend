const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
    tokenId: String,
    value: Number,
    verificationCount: Number,
    meta: String,
    issuedDate: Date,
    burnDate: Date,
    verifiedStatus: String,
    owner: String,
    contractAddress: String,

});

module.exports = mongoose.model('Token', TokenSchema);