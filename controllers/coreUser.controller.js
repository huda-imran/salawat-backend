// controllers/core.controller.js
const User = require('../models/user.model'); // Assuming you have this
const createWallet = require('../utils/wallet');
const { ethers, JsonRpcProvider } = require('ethers');
const ProjectSalawatManagementABI = require('../abi/ProjectSalawatManagement.json');
const CONTRACT_ADDRESS = process.env.PROJECT_SALAWAT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Admin wallet
const bcrypt = require('bcryptjs');

exports.createCoreMember = async(req, res) => {
    try {
        const { username, fullName, email, id, password } = req.body;

        const { address, privateKey } = createWallet();

        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ProjectSalawatManagementABI, wallet);

        const tx = await contract.createCoreMember(address);
        await tx.wait();
        const hashed = await bcrypt.hash(password, 10);

        await User.create({ username, fullName, email, id, password: hashed, walletAddress: address, privateKey, role: 'core', createdBy: wallet.address });

        res.json({ success: true, address });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// controllers/core.controller.js
exports.updateCoreMember = async(req, res) => {
    try {
        const { username } = req.params;
        const update = req.body;

        const updated = await User.findOneAndUpdate({ username }, update, { new: true });
        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.deleteCoreMember = async(req, res) => {
    try {
        console.log(`🔍 Finding user with username: ${req.params.username}`);
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            console.warn('❌ User not found');
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log(`👤 User found: ${user.username} (${user.walletAddress})`);

        const provider = new JsonRpcProvider(process.env.RPC_URL);
        console.log("Hello");
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        console.log("Hello 2");
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ProjectSalawatManagementABI, wallet);
        console.log("Hello 3");
        console.log('📨 Sending transaction to remove core member on-chain...');
        const tx = await contract.removeCoreMember(user.walletAddress);
        console.log(`⛓️ Transaction sent: ${tx.hash}`);

        await tx.wait();
        console.log('✅ Transaction confirmed. Core member removed from contract.');

        await User.deleteOne({ username: req.params.username });
        console.log('🗑️ User removed from MongoDB.');

        res.json({ success: true });
    } catch (err) {
        console.error('🔥 Error in deleteCoreMember:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};



exports.getAllCoreMembers = async(req, res) => {
    try {
        const users = await User.find({ role: 'core' });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};