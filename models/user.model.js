const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    id: { type: String, required: true }, // National ID or system ID

    walletAddress: { type: String, required: true, unique: true },
    privateKey: { type: String, required: true },

    role: { type: String, enum: ['admin', 'core', 'builder', 'member'], required: true },

    createdBy: { type: String }, // Username of builder or admin who created this user
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);