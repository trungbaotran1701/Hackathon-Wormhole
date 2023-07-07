"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceivedData = exports.createReceiveMessageInstruction = exports.createSendMessageInstruction = exports.createRegisterForeignEmitterInstruction = exports.createInitializeInstruction = exports.createHellowormProgramInterface = exports.deriveReceivedKey = exports.deriveWormholeMessageKey = exports.getForeignEmitterData = exports.deriveForeignEmitterKey = exports.deriveConfigKey = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@project-serum/anchor");
const helloworm_json_1 = __importDefault(require("./helloworm.json"));
const wormhole_1 = require("@certusone/wormhole-sdk/lib/cjs/solana/wormhole");
const solana_1 = require("@certusone/wormhole-sdk/lib/cjs/solana");
const wormhole_sdk_1 = require("@certusone/wormhole-sdk");
function deriveConfigKey(programId) {
    return (0, solana_1.deriveAddress)([Buffer.from("config")], programId);
}
exports.deriveConfigKey = deriveConfigKey;
function deriveForeignEmitterKey(programId, chain) {
    return (0, solana_1.deriveAddress)([
        Buffer.from("foreign_emitter"),
        (() => {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(chain);
            return buf;
        })(),
    ], programId);
}
exports.deriveForeignEmitterKey = deriveForeignEmitterKey;
async function getForeignEmitterData(connection, programId, chain, commitment) {
    const { chain: _, address } = await createHellowormProgramInterface(connection, programId).account.foreignEmitter.fetch(deriveForeignEmitterKey(programId, chain), commitment);
    return {
        chain,
        address: Buffer.from(address),
    };
}
exports.getForeignEmitterData = getForeignEmitterData;
function deriveWormholeMessageKey(programId, sequence) {
    return (0, solana_1.deriveAddress)([
        Buffer.from("sent"),
        (() => {
            const buf = Buffer.alloc(8);
            buf.writeBigUInt64LE(sequence);
            return buf;
        })(),
    ], programId);
}
exports.deriveWormholeMessageKey = deriveWormholeMessageKey;
function deriveReceivedKey(programId, chain, sequence) {
    return (0, solana_1.deriveAddress)([
        Buffer.from("received"),
        (() => {
            const buf = Buffer.alloc(10);
            buf.writeUInt16LE(chain, 0);
            buf.writeBigInt64LE(sequence, 2);
            return buf;
        })(),
    ], programId);
}
exports.deriveReceivedKey = deriveReceivedKey;
function createHellowormProgramInterface(connection, programId, payer) {
    const provider = {
        connection,
        publicKey: payer == undefined ? undefined : new web3_js_1.PublicKey(payer),
    };
    return new anchor_1.Program(helloworm_json_1.default, new web3_js_1.PublicKey(programId), provider);
}
exports.createHellowormProgramInterface = createHellowormProgramInterface;
async function createInitializeInstruction(connection, programId, payer, wormholeProgramId) {
    const program = createHellowormProgramInterface(connection, programId);
    const message = deriveWormholeMessageKey(programId, 1n);
    const wormholeAccounts = (0, solana_1.getPostMessageCpiAccounts)(program.programId, wormholeProgramId, payer, message);
    return program.methods
        .initialize()
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        config: deriveConfigKey(programId),
        wormholeProgram: new web3_js_1.PublicKey(wormholeProgramId),
        ...wormholeAccounts,
    })
        .instruction();
}
exports.createInitializeInstruction = createInitializeInstruction;
async function createRegisterForeignEmitterInstruction(connection, programId, payer, emitterChain, emitterAddress) {
    const program = createHellowormProgramInterface(connection, programId);
    return program.methods
        .registerEmitter(emitterChain, [...emitterAddress])
        .accounts({
        owner: new web3_js_1.PublicKey(payer),
        config: deriveConfigKey(program.programId),
        foreignEmitter: deriveForeignEmitterKey(program.programId, emitterChain),
    })
        .instruction();
}
exports.createRegisterForeignEmitterInstruction = createRegisterForeignEmitterInstruction;
async function createSendMessageInstruction(connection, programId, payer, wormholeProgramId, helloMessage, commitment) {
    const program = createHellowormProgramInterface(connection, programId);
    // get sequence
    const message = await (0, wormhole_1.getProgramSequenceTracker)(connection, programId, wormholeProgramId, commitment).then((tracker) => deriveWormholeMessageKey(programId, tracker.sequence + 1n));
    const wormholeAccounts = (0, solana_1.getPostMessageCpiAccounts)(programId, wormholeProgramId, payer, message);
    return program.methods
        .sendMessage(helloMessage)
        .accounts({
        config: deriveConfigKey(programId),
        wormholeProgram: new web3_js_1.PublicKey(wormholeProgramId),
        ...wormholeAccounts,
    })
        .instruction();
}
exports.createSendMessageInstruction = createSendMessageInstruction;
async function createReceiveMessageInstruction(connection, programId, payer, wormholeProgramId, wormholeMessage) {
    const program = createHellowormProgramInterface(connection, programId);
    const parsed = (0, wormhole_sdk_1.isBytes)(wormholeMessage)
        ? (0, wormhole_sdk_1.parseVaa)(wormholeMessage)
        : wormholeMessage;
    return program.methods
        .receiveMessage([...parsed.hash])
        .accounts({
        payer: new web3_js_1.PublicKey(payer),
        config: deriveConfigKey(programId),
        wormholeProgram: new web3_js_1.PublicKey(wormholeProgramId),
        posted: (0, wormhole_1.derivePostedVaaKey)(wormholeProgramId, parsed.hash),
        foreignEmitter: deriveForeignEmitterKey(programId, parsed.emitterChain),
        received: deriveReceivedKey(programId, parsed.emitterChain, parsed.sequence),
    })
        .instruction();
}
exports.createReceiveMessageInstruction = createReceiveMessageInstruction;
async function getReceivedData(connection, programId, chain, sequence, commitment) {
    return createHellowormProgramInterface(connection, programId)
        .account.received.fetch(deriveReceivedKey(programId, chain, sequence), commitment)
        .then((received) => {
        return { batchId: received.batchId, message: received.message };
    });
}
exports.getReceivedData = getReceivedData;
