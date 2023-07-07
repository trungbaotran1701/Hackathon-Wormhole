import {
    Connection,
    PublicKeyInitData,
    PublicKey,
    TransactionInstruction,
    Commitment,
  } from "@solana/web3.js";
  import { Program, Provider } from "@project-serum/anchor";
  import { Helloworm } from "./helloworm";
  import IDL from "./helloworm.json";
  import {
    getProgramSequenceTracker,
    derivePostedVaaKey,
  } from "@certusone/wormhole-sdk/lib/cjs/solana/wormhole";
  import {
    getPostMessageCpiAccounts,
    deriveAddress,
  } from "@certusone/wormhole-sdk/lib/cjs/solana";
  import {
    isBytes,
    ParsedVaa,
    parseVaa,
    SignedVaa,
  } from "@certusone/wormhole-sdk";
  
  export function deriveConfigKey(programId: PublicKeyInitData) {
    return deriveAddress([Buffer.from("config")], programId);
  }
  
  export function deriveForeignEmitterKey(
    programId: PublicKeyInitData,
    chain: number
  ) {
    return deriveAddress(
      [
        Buffer.from("foreign_emitter"),
        (() => {
          const buf = Buffer.alloc(2);
          buf.writeUInt16LE(chain);
          return buf;
        })(),
      ],
      programId
    );
  }
  
  export interface ForeignEmitter {
    chain: number;
    address: Buffer;
  }
  
  export async function getForeignEmitterData(
    connection: Connection,
    programId: PublicKeyInitData,
    chain: number,
    commitment?: Commitment
  ): Promise<ForeignEmitter> {
    const { chain: _, address } = await createHellowormProgramInterface(
      connection,
      programId
    ).account.foreignEmitter.fetch(
      deriveForeignEmitterKey(programId, chain),
      commitment
    );
    return {
      chain,
      address: Buffer.from(address),
    };
  }
  
  export function deriveWormholeMessageKey(
    programId: PublicKeyInitData,
    sequence: bigint
  ) {
    return deriveAddress(
      [
        Buffer.from("sent"),
        (() => {
          const buf = Buffer.alloc(8);
          buf.writeBigUInt64LE(sequence);
          return buf;
        })(),
      ],
      programId
    );
  }
  
  export function deriveReceivedKey(
    programId: PublicKeyInitData,
    chain: number,
    sequence: bigint
  ) {
    return deriveAddress(
      [
        Buffer.from("received"),
        (() => {
          const buf = Buffer.alloc(10);
          buf.writeUInt16LE(chain, 0);
          buf.writeBigInt64LE(sequence, 2);
          return buf;
        })(),
      ],
      programId
    );
  }
  
  export function createHellowormProgramInterface(
    connection: Connection,
    programId: PublicKeyInitData,
    payer?: PublicKeyInitData
  ): Program<Helloworm> {
    const provider: Provider = {
      connection,
      publicKey: payer == undefined ? undefined : new PublicKey(payer),
    };
    return new Program<Helloworm>(IDL as any, new PublicKey(programId), provider);
  }
  
  export async function createInitializeInstruction(
    connection: Connection,
    programId: PublicKeyInitData,
    payer: PublicKeyInitData,
    wormholeProgramId: PublicKeyInitData
  ): Promise<TransactionInstruction> {
    const program = createHellowormProgramInterface(connection, programId);
  
    const message = deriveWormholeMessageKey(programId, 1n);
  
    const wormholeAccounts = getPostMessageCpiAccounts(
      program.programId,
      wormholeProgramId,
      payer,
      message
    );
  
    return program.methods
      .initialize()
      .accounts({
        owner: new PublicKey(payer),
        config: deriveConfigKey(programId),
        wormholeProgram: new PublicKey(wormholeProgramId),
        ...wormholeAccounts,
      })
      .instruction();
  }
  
  export async function createRegisterForeignEmitterInstruction(
    connection: Connection,
    programId: PublicKeyInitData,
    payer: PublicKeyInitData,
    emitterChain: number,
    emitterAddress: Buffer
  ): Promise<TransactionInstruction> {
    const program = createHellowormProgramInterface(connection, programId);
    return program.methods
      .registerEmitter(emitterChain, [...emitterAddress])
      .accounts({
        owner: new PublicKey(payer),
        config: deriveConfigKey(program.programId),
        foreignEmitter: deriveForeignEmitterKey(program.programId, emitterChain),
      })
      .instruction();
  }
  
  export async function createSendMessageInstruction(
    connection: Connection,
    programId: PublicKeyInitData,
    payer: PublicKeyInitData,
    wormholeProgramId: PublicKeyInitData,
    helloMessage: Buffer,
    commitment?: Commitment
  ): Promise<TransactionInstruction> {
    const program = createHellowormProgramInterface(connection, programId);
  
    // get sequence
    const message = await getProgramSequenceTracker(
      connection,
      programId,
      wormholeProgramId,
      commitment
    ).then((tracker) =>
      deriveWormholeMessageKey(programId, tracker.sequence + 1n)
    );
  
    const wormholeAccounts = getPostMessageCpiAccounts(
      programId,
      wormholeProgramId,
      payer,
      message
    );
  
    return program.methods
      .sendMessage(helloMessage)
      .accounts({
        config: deriveConfigKey(programId),
        wormholeProgram: new PublicKey(wormholeProgramId),
        ...wormholeAccounts,
      })
      .instruction();
  }
  
  export async function createReceiveMessageInstruction(
    connection: Connection,
    programId: PublicKeyInitData,
    payer: PublicKeyInitData,
    wormholeProgramId: PublicKeyInitData,
    wormholeMessage: SignedVaa | ParsedVaa
  ): Promise<TransactionInstruction> {
    const program = createHellowormProgramInterface(connection, programId);
  
    const parsed = isBytes(wormholeMessage)
      ? parseVaa(wormholeMessage)
      : wormholeMessage;
  
    return program.methods
      .receiveMessage([...parsed.hash])
      .accounts({
        payer: new PublicKey(payer),
        config: deriveConfigKey(programId),
        wormholeProgram: new PublicKey(wormholeProgramId),
        posted: derivePostedVaaKey(wormholeProgramId, parsed.hash),
        foreignEmitter: deriveForeignEmitterKey(programId, parsed.emitterChain),
        received: deriveReceivedKey(
          programId,
          parsed.emitterChain,
          parsed.sequence
        ),
      })
      .instruction();
  }
  
  export interface Received {
    batchId: number;
    message: Buffer;
  }
  
  export async function getReceivedData(
    connection: Connection,
    programId: PublicKeyInitData,
    chain: number,
    sequence: bigint,
    commitment?: Commitment
  ): Promise<Received> {
    return createHellowormProgramInterface(connection, programId)
      .account.received.fetch(
        deriveReceivedKey(programId, chain, sequence),
        commitment
      )
      .then((received) => {
        return { batchId: received.batchId, message: received.message as Buffer };
      });
  }
  