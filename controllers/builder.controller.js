const { ethers, JsonRpcProvider } = require('ethers');
const ProjectSalawatManagement = require('../abi/ProjectSalawatManagement.json');
const CommunityManagement = require('../abi/CommunityManagement.json');
const User = require('../models/user.model');
const Community = require('../models/community.model');


// Setup provider and signer
const provider = new JsonRpcProvider(process.env.RPC_URL);
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
console.log(adminWallet)

const accessControl = new ethers.Contract(
    process.env.PROJECT_SALAWAT_ADDRESS,
    ProjectSalawatManagement,
    adminWallet
);


const communityContract = new ethers.Contract(
    process.env.COMMUNITY_MANAGEMENT_ADDRESS,
    CommunityManagement,
    adminWallet
);



exports.createBuilder = async(req, res) => {
    try {
        const { username, password, fullName, id, email, walletAddress, privateKey } = req.body;

        const newUser = new User({
            username,
            password,
            fullName,
            id,
            email,
            walletAddress,
            privateKey,
            role: 'builder',
        });

        await newUser.save();

        const builderRole = await accessControl.COMMUNITY_BUILDER_ROLE();
        const tx = await accessControl.grantRole(builderRole, walletAddress);
        await tx.wait();

        res.status(201).json({ message: 'Builder created and role granted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create builder' });
    }
};

exports.updateBuilder = async(req, res) => {
    try {
        const { username } = req.params;
        const updates = req.body;

        const updatedUser = await User.findOneAndUpdate({ username }, updates, { new: true });
        if (!updatedUser) return res.status(404).json({ message: 'Builder not found' });

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update builder' });
    }
};

exports.deleteBuilder = async(req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOneAndDelete({ username });

        if (!user) return res.status(404).json({ message: 'Builder not found' });

        const builderRole = await accessControl.COMMUNITY_BUILDER_ROLE();
        const tx = await accessControl.revokeRole(builderRole, user.walletAddress);
        await tx.wait();

        res.json({ message: 'Builder deleted and role revoked.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete builder' });
    }
};

exports.getAllBuilders = async(req, res) => {
    try {
        const builders = await User.find({ role: 'builder' });
        res.json(builders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch builders' });
    }
};

exports.getCommunities = async(req, res) => {
    try {
        const { username } = req.params;
        const builder = await User.findOne({ username });

        if (!builder) return res.status(404).json({ message: 'Builder not found' });

        const communities = await Community.find({ builderWallet: builder.walletAddress });
        const ids = communities.map(c => c.communityId);

        res.json(ids);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch communities' });
    }
};

exports.getRegisteredMembers = async(req, res) => {
    try {
        const { username } = req.params;

        const members = await User.find({ role: 'member', createdBy: username });
        const ids = members.map(m => m.username);

        res.json(ids);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch registered members' });
    }
};

exports.createCommunity = async(req, res) => {
    try {
        const { name, builderUsername } = req.body;
        const builder = await User.findOne({ username: builderUsername });

        if (!builder) return res.status(404).json({ message: 'Builder not found' });

        const tx = await communityContract.createCommunity(name, builder.walletAddress);
        await tx.wait();

        const communityId = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(['string', 'address'], [name, builder.walletAddress])
        );

        const newCommunity = new Community({
            communityId,
            name,
            builderWallet: builder.walletAddress,
        });

        await newCommunity.save();

        res.json({ message: 'Community created on chain and stored in DB.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create community' });
    }
};