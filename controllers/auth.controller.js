const User = require('../models/user.model');
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
        const hashed = await bcrypt.hash(password, 10);
        console.log(hashed)
        console.log(`👤 User found: ${user.username}`);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.warn(`🔒 Password mismatch for user "${username}"`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        console.log(`✅ Login successful - Token generated for user "${username}"`);

        res.json({
            token,
            user: {
                username: user.username,
                role: user.role,
                walletAddress: user.walletAddress,
            }
        });
    } catch (err) {
        console.error('🔥 Error during loginUser:', err);
        res.status(500).json({ message: 'Server error' });
    }
};