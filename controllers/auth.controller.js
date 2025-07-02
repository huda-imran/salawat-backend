const User = require('../models/user.model');
const Community = require('../models/community.model');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

exports.loginUser = async(req, res) => {
    const { username, password, role } = req.body;

    console.log(`🔐 Login attempt - Username: ${username}, Role: ${role}`);

    try {
        const user = await User.findOne({ username, role });

        if (!user) {
            console.warn(`❌ No user found with username "${username}" and role "${role}"`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.warn(`🔒 Password mismatch for user "${username}"`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        console.log(`✅ Login successful - Token generated for user "${username}"`);

        let builderUsername = null;
        let builderWallet = null;
        let communityName = null;

        if (user.role === 'member' && user.createdBy) {
            const builder = await User.findOne({ walletAddress: user.createdBy, role: 'builder' });
            if (builder) {
                builderUsername = builder.username;
                builderWallet = builder.walletAddress;
            }
        }

        if (user.communityId) {
            const community = await Community.findOne({ communityId: user.communityId });
            if (community) {
                communityName = community.name;
            }
        }

        const sent_user = {
            username: user.username,
            role: user.role,
            walletAddress: user.walletAddress,
            communityId: user.communityId || null,
            communityName,
            builderUsername,
            builderWallet
        };

        console.log(sent_user);
        res.json({
            token,
            user: sent_user
        });
    } catch (err) {
        console.error('🔥 Error during loginUser:', err);
        res.status(500).json({ message: 'Server error' });
    }
};