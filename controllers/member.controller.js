const User = require('../models/user.model');
const { Wallet } = require('ethers');
const { ethers, JsonRpcProvider } = require('ethers');
const ProjectSalawatManagementABI = require('../abi/ProjectSalawatManagement.json');
const CONTRACT_ADDRESS = process.env.PROJECT_SALAWAT_ADDRESS;


exports.createMember = async(req, res) => {
    try {
        const { username, password, fullName, id, email, createdBy } = req.body;

        // Generate a new wallet
        const wallet = Wallet.createRandom();
        const walletAddress = wallet.address;
        const privateKey = wallet.privateKey;

        const newMember = new User({
            username,
            password,
            fullName,
            id,
            email,
            walletAddress,
            privateKey,
            role: 'member',
            createdBy, // Builder's username
        });

        await newMember.save();

        res.status(201).json({
            message: 'Member created successfully.',
            walletAddress, // Optionally return wallet info
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create member' });
    }
};

exports.updateMember = async(req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;

        const updated = await User.findOneAndUpdate({ username, role: 'member' }, updates, { new: true });
        if (!updated) return res.status(404).json({ message: 'Member not found' });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update member' });
    }
};

exports.deleteMember = async(req, res) => {
    try {
        const { username } = req.params;
        const deleted = await User.findOneAndDelete({ username, role: 'member' });

        if (!deleted) return res.status(404).json({ message: 'Member not found' });

        res.json({ message: 'Member deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete member' });
    }
};

exports.getMembersByBuilder = async(req, res) => {
    try {
        const { builderUsername } = req.params;
        const members = await User.find({ role: 'member', createdBy: builderUsername });

        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch members' });
    }
};