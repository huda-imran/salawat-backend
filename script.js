const { ethers } = require('ethers');
const LogsDecoder = require('logs-decoder');

// ✅ Create decoder instance
const logsDecoder = LogsDecoder.create();

// ✅ Add the ABI
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

// Setup provider (can be Infura, Alchemy, or a local node)
const provider = new ethers.JsonRpcProvider("https://polygon-amoy.g.alchemy.com/v2/fVgzi0w8d70ClIcWw3D-2E6P4KLt509i");

// ✅ Replace with your transaction hash
const txHash = "0xa56844189234706dbd5f90f7fac3f2a457d4d25b335e3e6724602e74ead5217d";

async function decodeTxLogs() {
    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        const decodedLogs = logsDecoder.decodeLogs(receipt.logs);
        console.log("✅ Decoded Logs:");
        console.dir(decodedLogs, { depth: null });
    } catch (err) {
        console.error("❌ Error decoding logs:", err.message);
    }
}

decodeTxLogs();