const { ethers, JsonRpcProvider } = require('ethers');
const ProjectSalawatManagement = require('../abi/ProjectSalawatManagement.json');
const CommunityManagement = require('../abi/CommunityManagement.json');
const User = require('../models/user.model');
const createWallet = require('../utils/wallet');
const Community = require('../models/community.model');
const bcrypt = require('bcryptjs');

const LogsDecoder = require('logs-decoder');

// Prepare the logs-decoder instance and ABI once
const logsDecoder = LogsDecoder.create();


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
        const { username, password, fullName, id, email, createdBy } = req.body;
        console.log(`📥 Request to create builder: ${username} by creator wallet: ${createdBy}`);

        const { address, privateKey } = createWallet();

        // Find the creator core user
        console.log(`🔍 Searching for creator with wallet: ${createdBy}`);
        const creator = await User.findOne({
            username: createdBy,
            role: { $in: ['core', 'admin'] }
            });

        if (!creator || !creator.privateKey) {
            console.warn(`🚫 Creator not found or missing privateKey: ${createdBy}`);
            return res.status(403).json({ message: 'Creator not found or invalid permissions' });
        }

        console.log(`👤 Creator found: ${creator.username}`);

        // Grant role using creator's wallet
        const creatorWallet = new ethers.Wallet(creator.privateKey, provider);
        const builderAccessContract = new ethers.Contract(
            process.env.PROJECT_SALAWAT_ADDRESS,
            ProjectSalawatManagement,
            creatorWallet
        );

        console.log('🛠️ Preparing to grant COMMUNITY_BUILDER_ROLE...');
        const tx = await builderAccessContract.createCommunityBuilder(address);

        console.log(`📤 Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log('✅ Transaction confirmed. Role granted.');
        const hashed = await bcrypt.hash(password, 10);
        // Prepare new user object but don't save yet
        const newUser = new User({
            username,
            password:hashed,
            fullName,
            id,
            email,
            walletAddress: address,
            privateKey,
            role: 'builder',
            createdBy: creator.walletAddress,
        });

        await newUser.save();
        console.log(`✅ Builder ${username} saved to DB.`);

        res.status(201).json({ message: 'Builder created and role granted using creator wallet.' });
    } catch (err) {
        console.error('🔥 Error in createBuilder:', err);
        res.status(500).json({ message: 'Failed to create builder', error: err.message });
    }
};


exports.updateBuilder = async(req, res) => {
    try {
        const { username } = req.params;
        let update = {...req.body };

        // 🔐 If password is present in the update, hash it first
        if (update.password) {
            const hashed = await bcrypt.hash(update.password, 10);
            update.password = hashed;
        }

        const updatedUser = await User.findOneAndUpdate({ username }, update, { new: true });
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

        // 🔍 Step 1: Find builder by username
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'Builder not found' });

        const creatorWalletAddress = user.createdBy;

        // 🔍 Step 2: Find creator (core user) by wallet address
        const creator = await User.findOne({ walletAddress: creatorWalletAddress, role: 'core' });
        if (!creator || !creator.privateKey) {
            return res.status(403).json({ message: 'Creator not found or missing privateKey' });
        }

        // 🔐 Step 3: Use creator's wallet to call removeCommunityBuilder
        const creatorWallet = new ethers.Wallet(creator.privateKey, provider);
        const contract = new ethers.Contract(
            process.env.PROJECT_SALAWAT_ADDRESS,
            ProjectSalawatManagement,
            creatorWallet
        );

        console.log(`🧾 Calling removeCommunityBuilder for ${user.walletAddress}`);
        const tx = await contract.removeCommunityBuilder(user.walletAddress);
        await tx.wait();
        console.log(`✅ Role revoked for ${user.walletAddress}`);

        // Step 4: Delete user from DB
        await User.deleteOne({ username });
        console.log(`🗑️ User ${username} removed from MongoDB.`);

        res.json({ message: 'Builder deleted and role revoked using creator wallet.' });

    } catch (err) {
        console.error('🔥 Error in deleteBuilder:', err);
        res.status(500).json({ message: 'Failed to delete builder', error: err.message });
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

exports.getCommunities = async (req, res) => {
    try {
        const { username } = req.params;

        const builder = await User.findOne({ username });
        if (!builder) return res.status(404).json({ message: 'Builder not found' });

        const communities = await Community.find({ builderWallet: builder.walletAddress });

        // 🧾 Return both ID and name
        const result = communities.map(c => ({
            communityId: c.communityId,
            name: c.name
        }));

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch communities' });
    }
};

exports.getRegisteredMembers = async (req, res) => {
  try {
    const { username } = req.params;

    // 🔍 Find the builder by username
    const builder = await User.findOne({ username, role: 'builder' });
    if (!builder) {
      return res.status(404).json({ message: 'Builder not found' });
    }

    // 🧾 Use builder's walletAddress to find members
    const members = await User.find({ role: 'member', createdBy: builder.walletAddress });

    // Return relevant member details including communityId
    const data = members.map(m => ({
      username: m.username,
      walletAddress: m.walletAddress,
      communityId: m.communityId || null // handle possible missing field
    }));

    res.json(data);
  } catch (err) {
    console.error('Error in getRegisteredMembers:', err);
    res.status(500).json({ message: 'Failed to fetch registered members' });
  }
};

  

exports.createCommunity = async(req, res) => {

    // Prepare the logs-decoder instance and ABI once
    const logsDecoder = LogsDecoder.create();
    const abi = [{
        anonymous: false,
        inputs: [
            { indexed: true, name: "builder", type: "address" },
            { indexed: true, name: "communityId", type: "bytes32" },
            { indexed: false, name: "name", type: "string" }
        ],
        name: "CommunityCreated",
        type: "event"
    }];
    logsDecoder.addABI(abi);
    try {
        const { name, builderUsername } = req.body;
        console.log('Received request to create community with:', { name, builderUsername });

        const builder = await User.findOne({ username: builderUsername });
        console.log('Builder fetched from DB:', builder);

        if (!builder) {
            console.log('Builder not found');
            return res.status(404).json({ message: 'Builder not found' });
        }

        console.log('Calling contract to create community...');
        const tx = await communityContract.createCommunity(name, builder.walletAddress);
        console.log('Transaction submitted:', tx.hash);

        const receipt = await tx.wait();
        console.log('Transaction confirmed. Receipt:', receipt.transactionHash);

        // ✅ Use logs-decoder to parse event logs
        const decodedLogs = logsDecoder.decodeLogs(receipt.logs);
        const event = decodedLogs.find(e => e ?.name === 'CommunityCreated');

        if (!event) {
            console.error('CommunityCreated event not found.');
            return res.status(500).json({ message: 'Community creation failed — event not found.' });
        }

        const communityId = event.events.find(e => e.name === 'communityId') ?.value;
        console.log('Extracted communityId:', communityId);

        const newCommunity = new Community({
            communityId,
            name,
            builderWallet: builder.walletAddress,
        });

        await newCommunity.save();
        console.log('Community saved to DB:', newCommunity);

        res.json({ message: 'Community created on chain and stored in DB.', communityId });
    } catch (err) {
        console.error('Error creating community:', err);
        res.status(500).json({ message: 'Failed to create community', error: err.message });
    }
};

exports.getBuilderByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        // Find the builder by username
        const builder = await User.findOne({ username, role: 'builder' });

        if (!builder) {
            return res.status(404).json({ message: 'Builder not found' });
        }

        res.json(builder);
    } catch (err) {
        console.error('🔥 Error in getBuilderByUsername:', err);
        res.status(500).json({ message: 'Failed to fetch builder', error: err.message });
    }
};
