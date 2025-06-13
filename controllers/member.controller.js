const User = require('../models/user.model');
const { Wallet } = require('ethers');
const { ethers, JsonRpcProvider } = require('ethers');
const ProjectSalawatManagementABI = require('../abi/ProjectSalawatManagement.json');
const CONTRACT_ADDRESS = process.env.PROJECT_SALAWAT_ADDRESS;
const CommunityManagementABI = require('../abi/CommunityManagement.json');
const COMMUNITY_MANAGEMENT_ADDRESS = process.env.COMMUNITY_MANAGEMENT_ADDRESS;
const RPC_URL = process.env.RPC_URL;
const provider = new JsonRpcProvider(RPC_URL);
const bcrypt = require('bcryptjs');

exports.createMember = async(req, res) => {
    try {
        const { username, password, fullName, id, email, createdBy, communityId } = req.body;

        // 🔐 Find the builder by username and get their wallet
        const builder = await User.findOne({ username: createdBy, role: 'builder' });
        if (!builder || !builder.privateKey) {
            return res.status(403).json({ message: 'Builder not authorized or missing private key' });
        }

        // 🧾 Generate new wallet for the member
        const wallet = Wallet.createRandom();
        const walletAddress = wallet.address;
        const privateKey = wallet.privateKey;
        const hashed = await bcrypt.hash(password, 10);

        // 📄 Create user record in DB
        const newMember = new User({
            username,
            password: hashed,
            fullName,
            id,
            email,
            walletAddress,
            privateKey,
            role: 'member',
            createdBy: builder.walletAddress,
            communityId
        });

        // 🎯 Interact with CommunityManagement contract using builder's wallet
        const builderWallet = new ethers.Wallet(builder.privateKey, provider);
        const contract = new ethers.Contract(COMMUNITY_MANAGEMENT_ADDRESS, CommunityManagementABI, builderWallet);

        const tx = await contract.addMember(communityId, walletAddress);
        await tx.wait();

        await newMember.save();
        res.status(201).json({
            message: 'Member created and added to community',
            walletAddress
        });
    } catch (err) {
        console.error('❌ Error in createMember:', err);
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
        console.log(req.body)
        const { username, createdBy } = req.body;
        console.log(`📥 Request to delete member: username=${username}, createdBy=${createdBy}`);

        // 📦 Find the member to delete
        const member = await User.findOne({ username, role: 'member' });
        if (!member) {
            console.log('❌ Member not found');
            return res.status(404).json({ message: 'Member not found' });
        }
        console.log(`✅ Member found: ${member.username} (${member.walletAddress})`);

        // 🧭 Get communityId from member data
        const communityId = member.communityId;
        if (!communityId) {
            console.log('❌ Member has no assigned community');
            return res.status(400).json({ message: 'Member has no assigned community' });
        }
        console.log(`📛 Community ID: ${communityId}`);

        // 🔐 Find the builder by username and get their wallet
        const builder = await User.findOne({ username: createdBy, role: 'builder' });
        if (!builder || !builder.privateKey) {
            console.log('❌ Builder not found or missing private key');
            return res.status(403).json({ message: 'Builder not authorized or missing private key' });
        }
        console.log(`✅ Builder found: ${builder.username} (${builder.walletAddress})`);

        // 🔗 Interact with the smart contract to remove member
        const builderWallet = new ethers.Wallet(builder.privateKey, provider);
        const contract = new ethers.Contract(COMMUNITY_MANAGEMENT_ADDRESS, CommunityManagementABI, builderWallet);

        console.log('📝 Sending transaction to remove member from smart contract...');
        const tx = await contract.removeMember(communityId, member.walletAddress);
        await tx.wait();
        console.log('✅ Member removed from smart contract');

        // 🗑️ Remove member from DB
        await member.deleteOne();
        console.log('✅ Member deleted from database');

        res.json({ message: 'Member removed and deleted successfully' });

    } catch (err) {
        console.error('❌ Error in deleteMember:', err);
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

exports.searchMember = async(req, res) => {
    try {
        const { builderUsername, query } = req.body;
        console.log('📥 Request body:', req.body);

        if (!builderUsername || !query) {
            console.log('❌ builderUsername and query are required');
            return res.status(400).json({ message: 'builderUsername and query are required' });
        }

        // 🔐 Find builder and get their wallet address
        const builder = await User.findOne({ username: builderUsername, role: 'builder' });
        if (!builder) {
            console.log(`❌ Builder not found: ${builderUsername}`);
            return res.status(404).json({ message: 'Builder not found' });
        }

        console.log(`✅ Builder found: ${builder.username} (${builder.walletAddress})`);

        // 🔎 Detect type of query
        const isWalletAddress = query.startsWith('0x') && query.length === 42;
        const isEmail = query.includes('@') && query.includes('.');
        const isUsername = !isWalletAddress && !isEmail;

        const searchCriteria = {
            role: 'member',
            createdBy: builder.walletAddress,
        };

        if (isWalletAddress) {
            searchCriteria.walletAddress = query;
            console.log(`🔍 Searching by walletAddress: ${query}`);
        } else if (isEmail) {
            searchCriteria.email = query;
            console.log(`🔍 Searching by email: ${query}`);
        } else if (isUsername) {
            searchCriteria.username = query;
            console.log(`🔍 Searching by username: ${query}`);
        } else {
            console.log('❌ Invalid query format');
            return res.status(400).json({ message: 'Invalid query format' });
        }

        const member = await User.findOne(searchCriteria);

        if (!member) {
            console.log('❌ No matching member found');
            return res.status(404).json({ message: 'No matching member found for this builder' });
        }

        console.log(`✅ Member found: ${member.username} (${member.walletAddress})`);
        res.json(member);
    } catch (err) {
        console.error('❌ Error in searchMember:', err);
        res.status(500).json({ message: 'Failed to search member' });
    }
};