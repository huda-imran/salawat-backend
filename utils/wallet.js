// utils/wallet.js
const { Wallet } = require('ethers');

function createWallet() {
    const wallet = Wallet.createRandom();
    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
    };
}

module.exports = createWallet;