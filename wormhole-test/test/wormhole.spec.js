"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const anchor = __importStar(require("@project-serum/anchor"));
const needed_1 = require("../needed");
const web3_js_1 = require("@solana/web3.js");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
(0, mocha_1.describe)('Test Solana interact with wormhole', async () => {
    const messageTransfer = {
        from: '0x86f93CdC9cD700C018AC0235D6eB249B38609A0f',
        to: '0x86f93CdC9cD700C018AC0235D6eB249B38609A0f',
        tokenAddess: '0xec171F51676B62127a4BdfB145944cf8e6fDe08c',
        amount: 10000000000000000000,
    };
    const jsonString = JSON.stringify(messageTransfer);
    let helloMessage = Buffer.from(jsonString, 'utf8');
    helloMessage = Buffer.concat([
        Buffer.from(new Uint8Array([2])),
        helloMessage,
    ]);
    const WORMHOLE_RPC_HOST = 'https://wormhole-v2-testnet-api.certus.one';
    const keypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from([
        13, 82, 117, 67, 249, 64, 150, 31, 116, 67, 234, 152, 255, 109, 62, 111,
        35, 170, 11, 56, 65, 18, 157, 242, 80, 97, 246, 84, 1, 65, 149, 181, 67,
        249, 215, 33, 158, 135, 96, 152, 226, 28, 89, 211, 255, 248, 42, 118, 35,
        1, 14, 106, 86, 195, 183, 2, 96, 13, 139, 199, 238, 239, 157, 74,
    ]));
    const CORE_BRIDGE_PID = new web3_js_1.PublicKey('3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5');
    const connection = new web3_js_1.Connection(anchor.web3.clusterApiUrl('devnet'));
    const programId = new web3_js_1.PublicKey('GsTfE4Ndievuh8G5EWAPcS7aixwKyN5YdZNymq2cVfNV');
    const program = (0, needed_1.createHellowormProgramInterface)(connection, programId);
    it('Attest Native Token', async () => {
        const transaction = new web3_js_1.Transaction();
        transaction.add(await (0, needed_1.createSendMessageInstruction)(connection, program.programId, keypair.publicKey, CORE_BRIDGE_PID, helloMessage));
        transaction.feePayer = keypair.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // sign, send, and confirm transaction
        transaction.partialSign(keypair);
        transaction.feePayer = keypair.publicKey;
        const txid = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: true,
            maxRetries: 5,
        });
        console.log('Transaction: ', txid);
        await connection.confirmTransaction(txid);
        const info = await connection.getTransaction(txid);
        if (info != null) {
            const sequence = (0, wormhole_sdk_1.parseSequenceFromLogSolana)(info);
            const emitterAddress = (0, wormhole_sdk_1.getEmitterAddressSolana)(program.programId);
            console.log(emitterAddress);
            const vaaURL = `${WORMHOLE_RPC_HOST}/v1/signed_vaa/${wormhole_sdk_1.CHAIN_ID_SOLANA}/${emitterAddress}/${sequence}`;
            console.log('Searching for: ', vaaURL);
            let vaaBytes = await (await fetch(vaaURL)).json();
            while (!vaaBytes.vaaBytes) {
                console.log('VAA not found, retrying in 5s!');
                await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
                vaaBytes = await (await fetch(vaaURL)).json();
            }
            console.log(vaaBytes);
        }
    });
});
