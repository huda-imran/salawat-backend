const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

exports.loginUser = async(req, res) => {
    const { username, password, role } = req.body;

    try {
        const user = await User.findOne({ username, role });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = generateToken(user._id);
        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};