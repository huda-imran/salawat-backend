// controllers/core.controller.js
const User = require('../models/user.model'); // Assuming you have this
const createWallet = require('../utils/wallet');
const { ethers, JsonRpcProvider } = require('ethers');
const ProjectSalawatManagementABI = require('../abi/ProjectSalawatManagement.json');
const CONTRACT_ADDRESS = process.env.PROJECT_SALAWAT_ADDRESS;
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Admin wallet

exports.createCoreMember = async(req, res) => {
    try {
        const { username, fullName, email, id } = req.body;

        const { address, privateKey } = createWallet();

        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ProjectSalawatManagementABI, wallet);

        const tx = await contract.createCoreMember(address);
        await tx.wait();

        await User.create({ username, fullName, email, id, walletAddress: address, privateKey, role: 'core', createdBy: address });

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
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const provider = new JsonRpcProvider(process.env.RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ProjectSalawatManagementABI, wallet);

        const tx = await contract.removeCoreMember(user.walletAddress);
        await tx.wait();

        await user.remove();
        res.json({ success: true });
    } catch (err) {
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