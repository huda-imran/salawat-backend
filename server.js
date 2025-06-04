const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
const User = require('./models/user.model');
const bcrypt = require('bcryptjs');

dotenv.config();
const PORT = process.env.PORT || 5000;

const createDefaultAdmin = async() => {
    const username = process.env.ADMIN_USERNAME;
    const rawPassword = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULLNAME;
    const email = process.env.ADMIN_EMAIL;
    const id = process.env.ADMIN_ID;
    const privateKey = process.env.ADMIN_PRIVATE_KEY;

    const role = 'admin';

    // Create wallet from private key
    const wallet = new ethers.Wallet(privateKey);
    const walletAddress = wallet.address;

    const existingAdmin = await User.findOne({ username, role });

    if (existingAdmin) {
        const passwordChanged = !(await bcrypt.compare(rawPassword, existingAdmin.password));

        if (passwordChanged) {
            const hashed = await bcrypt.hash(rawPassword, 10);
            existingAdmin.password = hashed;
            await existingAdmin.save();
            console.log('✅ Admin password updated');
        } else {
            console.log('✅ Admin already exists with current password');
        }

        return;
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await User.create({
        username,
        password: hashedPassword,
        fullName,
        email,
        id,
        walletAddress,
        privateKey,
        role,
    });

    console.log('✅ Admin account created');
};


mongoose.connect(process.env.MONGO_URI)
    .then(async() => {
        await createDefaultAdmin();
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error(err));