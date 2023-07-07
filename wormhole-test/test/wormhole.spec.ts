import { describe } from 'mocha';
import * as anchor from '@project-serum/anchor';
import {
  createHellowormProgramInterface,
  createSendMessageInstruction,
} from '../needed';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  CHAIN_ID_SOLANA,
  getEmitterAddressSolana,
  parseSequenceFromLogSolana,
} from '@certusone/wormhole-sdk';
import { ethers } from 'ethers';
describe('Test Solana interact with wormhole', async () => {
  type MessageTransfer = {
    from: ethers.Wallet['address'];
    to: ethers.Wallet['address'];
    tokenAddess: ethers.Wallet['address'];
    amount: number;
  };

  const messageTransfer: MessageTransfer = {
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
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from([
      13, 82, 117, 67, 249, 64, 150, 31, 116, 67, 234, 152, 255, 109, 62, 111,
      35, 170, 11, 56, 65, 18, 157, 242, 80, 97, 246, 84, 1, 65, 149, 181, 67,
      249, 215, 33, 158, 135, 96, 152, 226, 28, 89, 211, 255, 248, 42, 118, 35,
      1, 14, 106, 86, 195, 183, 2, 96, 13, 139, 199, 238, 239, 157, 74,
    ])
  );
  const CORE_BRIDGE_PID = new PublicKey(
    '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5'
  );

  const connection = new Connection(anchor.web3.clusterApiUrl('devnet'));

  const programId = new PublicKey(
    'GsTfE4Ndievuh8G5EWAPcS7aixwKyN5YdZNymq2cVfNV'
  );

  const program = createHellowormProgramInterface(connection, programId);

  it('Attest Native Token', async () => {
    const transaction = new Transaction();

    transaction.add(
      await createSendMessageInstruction(
        connection,
        program.programId,
        keypair.publicKey,
        CORE_BRIDGE_PID,
        helloMessage
      )
    );

    transaction.feePayer = keypair.publicKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
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
      const sequence = parseSequenceFromLogSolana(info);
      const emitterAddress = getEmitterAddressSolana(program.programId);
      console.log(emitterAddress);
      
      const vaaURL = `${WORMHOLE_RPC_HOST}/v1/signed_vaa/${CHAIN_ID_SOLANA}/${emitterAddress}/${sequence}`;
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
