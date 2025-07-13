const Token = require('../models/token.model');
const { ethers, JsonRpcProvider } = require('ethers');

require('dotenv').config();

const contractJson = require('../abi/token.json'); // Must include ABI and bytecode
const TokenCountRequest = require('../models/tokenCountRequest.model');
// Setup provider and admin wallet
const provider = new JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

exports.createToken = async(req, res) => {
    const { name, symbol, verificationCount } = req.body;

    try {
        const factory = new ethers.ContractFactory(
            contractJson.abi,
            contractJson.bytecode,
            wallet
        );

        const contract = await factory.deploy(name, symbol, wallet.address);

        const token = await Token.create({
            tokenId: contract.target,
            name,
            symbol,
            value: "0",
            verificationCount,
            issuedDate: new Date(),
            verifiedStatus: 'Pending',
            owner: wallet.address,
        });

        res.status(201).json({
            message: 'New token contract deployed',
            contractAddress: contract.address,
            token,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


exports.mintToken = async(req, res) => {
    const { receiver, tokenId, value } = req.body;

    try {
        const tokenData = await Token.findOne({ tokenId });
        if (!tokenData) return res.status(404).json({ message: 'Token not found' });

        const tokenContract = new ethers.Contract(
            tokenData.tokenId,
            contractJson.abi,
            wallet
        );

        const tx = await tokenContract.mint(receiver, ethers.parseUnits(value.toString(), 18));
        await tx.wait();

        const updatedToken = await Token.findOneAndUpdate({ tokenId }, { $inc: { value: parseFloat(value) }, verifiedStatus: 'Minted' }, { new: true });

        res.json({
            message: 'Token minted successfully',
            txHash: tx.hash,
            token: updatedToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};


exports.burnToken = async(req, res) => {
    const { tokenId, amount } = req.body;

    try {
        const tokenData = await Token.findOne({ tokenId });
        if (!tokenData) return res.status(404).json({ message: 'Token not found' });

        // Load the correct deployed contract
        const tokenContract = new ethers.Contract(
            tokenData.contractAddress,
            contractJson.abi,
            wallet
        );

        const tx = await tokenContract.burn(ethers.utils.parseUnits(amount.toString(), 18));
        await tx.wait();

        const updatedToken = await Token.findOneAndUpdate({ tokenId }, { burnDate: new Date(), verifiedStatus: 'Burned' }, { new: true });

        res.json({
            message: 'Token burned successfully',
            txHash: tx.hash,
            token: updatedToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /token/mark-complete/:tokenId
exports.markTokenComplete = async(req, res) => {
    try {
        const token = await Token.findOneAndUpdate({ tokenId: req.params.tokenId }, { verifiedStatus: 'Completed' }, { new: true });
        if (!token) return res.status(404).json({ message: 'Token not found' });
        res.json({ message: 'Status updated to Completed', token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllTokenCountRequests = async(req, res) => {
    try {
        const requests = await TokenCountRequest.find().sort({ submittedAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('❌ Error fetching token count requests:', err);
        res.status(500).json({ error: 'Failed to fetch token count requests' });
    }
};

exports.deleteTokenCountRequest = async(req, res) => {
    const { requestId } = req.params;

    try {
        const deleted = await TokenCountRequest.findByIdAndDelete(requestId);
        if (!deleted) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({ message: 'Request deleted successfully', deleted });
    } catch (err) {
        console.error('❌ Error deleting request:', err);
        res.status(500).json({ error: 'Failed to delete request' });
    }
};



exports.getTokenById = async(req, res) => {
    try {
        const token = await Token.findOne({ tokenId: req.params.id });
        if (!token) return res.status(404).json({ message: 'Not found' });
        res.json(token);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllTokens = async(req, res) => {
    try {
        const tokens = await Token.find().sort({ issuedDate: -1 });
        res.json(tokens);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};