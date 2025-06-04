const Token = require('../models/token.model');
const { ethers, JsonRpcProvider } = require('ethers');
require('dotenv').config();

const contractJson = require('../abi/token.json'); // Must include ABI and bytecode

// Setup provider and admin wallet
const provider = new JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

exports.mintToken = async(req, res) => {
    const { name, symbol, tokenId, value, verificationCount, meta } = req.body;

    try {
        const factory = new ethers.ContractFactory(
            contractJson.abi,
            contractJson.bytecode,
            wallet
        );

        const contract = await factory.deploy(name, symbol, wallet.address);
        await contract.deployed();

        const token = await Token.create({
            tokenId,
            value,
            verificationCount,
            meta,
            issuedDate: new Date(),
            verifiedStatus: 'Pending',
            owner: wallet.address,
            contractAddress: contract.address,
        });

        res.status(201).json({
            message: 'New token contract deployed',
            txHash: contract.deployTransaction.hash,
            contractAddress: contract.address,
            token,
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