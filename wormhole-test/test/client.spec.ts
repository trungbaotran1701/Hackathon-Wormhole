// tests/calculator.spec.tx
import { assert } from 'chai';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { ethers } from 'ethers';

import {
  getAssociatedTokenAddress,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  CONTRACTS,
  attestFromSolana,
  createWrappedOnEth,
  getEmitterAddressSolana,
  getIsTransferCompletedEth,
  parseSequenceFromLogSolana,
  redeemOnEth,
  transferFromSolana,
  transferNativeSol,
  tryNativeToUint8Array,
} from '@certusone/wormhole-sdk';

// describe('Solana to Ethereum', async () => {
//   const keypair = Keypair.fromSecretKey(
//     Uint8Array.from([
//       13, 82, 117, 67, 249, 64, 150, 31, 116, 67, 234, 152, 255, 109, 62, 111,
//       35, 170, 11, 56, 65, 18, 157, 242, 80, 97, 246, 84, 1, 65, 149, 181, 67,
//       249, 215, 33, 158, 135, 96, 152, 226, 28, 89, 211, 255, 248, 42, 118, 35,
//       1, 14, 106, 86, 195, 183, 2, 96, 13, 139, 199, 238, 239, 157, 74,
//     ])
//   );

//   const SOL_BRIDGE_ADDRESS = new PublicKey(
//     '3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5'
//   );
//   const SOL_TOKEN_BRIDGE_ADDRESS = new PublicKey(
//     'DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe'
//   );
//   const WORMHOLE_RPC_HOST = 'https://wormhole-v2-testnet-api.certus.one';
//   const TEST_SOLANA_TOKEN = new PublicKey(
//     'HyC6H4E2sEJGQoVMhapw1WLnSb51Mnapeh3Eqke68WCM'
//   );
//   const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
//   const ETH_NODE_URL =
//     'wss://eth-goerli.g.alchemy.com/v2/flDa5U0m2g843wmEXbvI1bB-vfQ3omms';
//   const ETH_PRIVATE_KEY =
//     '07bb8829d8dd4f2d92b6369e15945da6cbea4c1ddb38f2a2559282649c482279';

  
//     // it('Attest Native Token', async () => {
//     //     const transaction = await attestFromSolana(
//     //       connection,
//     //       SOL_BRIDGE_ADDRESS,
//     //       SOL_TOKEN_BRIDGE_ADDRESS,
//     //       keypair.publicKey,
//     //       NATIVE_MINT,
//     //     );
    
//     //     // sign, send, and confirm transaction
//     //     transaction.partialSign(keypair);
//     //     transaction.feePayer = keypair.publicKey;
//     //     const txid = await connection.sendRawTransaction(transaction.serialize(), {
//     //       skipPreflight: true,
//     //       maxRetries: 5,
//     //     });
//     //     console.log('Transaction: ', txid);
    
//     //     await connection.confirmTransaction(txid);
    
//     //     const info = await connection.getTransaction(txid);
//     //     if (info != null) {
//     //       const sequence = parseSequenceFromLogSolana(info);
//     //       const emitterAddress = await getEmitterAddressSolana(
//     //         SOL_TOKEN_BRIDGE_ADDRESS
//     //       );
    
//     //       const vaaURL = `${WORMHOLE_RPC_HOST}/v1/signed_vaa/${CHAIN_ID_SOLANA}/${emitterAddress}/${sequence}`;
//     //       console.log('Searching for: ', vaaURL);
//     //       let vaaBytes = await (await fetch(vaaURL)).json();
//     //       while (!vaaBytes.vaaBytes) {
//     //         console.log('VAA not found, retrying in 5s!');
//     //         await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
//     //         vaaBytes = await (await fetch(vaaURL)).json();
//     //       }
    
//     //       // create a signer for Eth
//     //       const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL);
//     //       const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider);
    
//     //       // Convert the base64-encoded string to a Buffer object
//     //       const buffer = Buffer.from(vaaBytes.vaaBytes, 'base64');
    
//     //       // Create a Uint8Array from the Buffer object
//     //       const uint8Array = new Uint8Array(buffer);
    
//     //       const wrappedTokenAddress = await createWrappedOnEth(
//     //         CONTRACTS.TESTNET.ethereum.token_bridge,
//     //         signer,
//     //         uint8Array
//     //       );
//     //       console.log('Wrapped token created at: ', wrappedTokenAddress);
    
//     //       provider.destroy();
//     //     }
    
//     //     await Promise.resolve();
//     //     assert.ok(true);
//     //   });

//   // it('Attest SPL Token', async () => {
//   //   const transaction = await attestFromSolana(
//   //     connection,
//   //     SOL_BRIDGE_ADDRESS,
//   //     SOL_TOKEN_BRIDGE_ADDRESS,
//   //     keypair.publicKey,
//   //     TEST_SOLANA_TOKEN
//   //   );

//   //   // sign, send, and confirm transaction
//   //   transaction.partialSign(keypair);
//   //   transaction.feePayer = keypair.publicKey;
//   //   const txid = await connection.sendRawTransaction(transaction.serialize(), {
//   //     skipPreflight: true,
//   //     maxRetries: 5,
//   //   });
//   //   console.log('Transaction: ', txid);

//   //   await connection.confirmTransaction(txid);

//   //   const info = await connection.getTransaction(txid);
//   //   if (info != null) {
//   //     const sequence = parseSequenceFromLogSolana(info);
//   //     const emitterAddress = await getEmitterAddressSolana(
//   //       SOL_TOKEN_BRIDGE_ADDRESS
//   //     );

//   //     const vaaURL = `${WORMHOLE_RPC_HOST}/v1/signed_vaa/${CHAIN_ID_SOLANA}/${emitterAddress}/${sequence}`;
//   //     console.log('Searching for: ', vaaURL);
//   //     let vaaBytes = await (await fetch(vaaURL)).json();
//   //     while (!vaaBytes.vaaBytes) {
//   //       console.log('VAA not found, retrying in 5s!');
//   //       await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
//   //       vaaBytes = await (await fetch(vaaURL)).json();
//   //     }

//   //     // create a signer for Eth
//   //     const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL);
//   //     const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider);

//   //     // Convert the base64-encoded string to a Buffer object
//   //     const buffer = Buffer.from(vaaBytes.vaaBytes, 'base64');

//   //     // Create a Uint8Array from the Buffer object
//   //     const uint8Array = new Uint8Array(buffer);

//   //     const wrappedTokenAddress = await createWrappedOnEth(
//   //       CONTRACTS.TESTNET.ethereum.token_bridge,
//   //       signer,
//   //       uint8Array
//   //     );
//   //     console.log('Wrapped token created at: ', wrappedTokenAddress);

//   //     provider.destroy();
//   //   }

//   //   await Promise.resolve();
//   //   assert.ok(true);
//   // });

//   // it('Send Solana SPL Token to Ethereum', async () => {
//   //   // create a signer for Eth
//   //   const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL);
//   //   const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider);
//   //   const targetAddress = await signer.getAddress();

//   //   const fromAddress = (
//   //     await getAssociatedTokenAddress(
//   //       new PublicKey(TEST_SOLANA_TOKEN),
//   //       keypair.publicKey
//   //     )
//   //   ).toString();
//   //   const amount: bigint = ethers.utils.parseUnits('100', 9).toBigInt();

//   //   // Submit transaction - results in a Wormhole message being published
//   //   const transaction = await transferFromSolana(
//   //     connection,
//   //     SOL_BRIDGE_ADDRESS,
//   //     SOL_TOKEN_BRIDGE_ADDRESS,
//   //     keypair.publicKey,
//   //     fromAddress,
//   //     TEST_SOLANA_TOKEN,
//   //     amount,
//   //     tryNativeToUint8Array(targetAddress, CHAIN_ID_ETH),
//   //     CHAIN_ID_ETH
//   //   );

//   //   // sign, send, and confirm transaction
//   //   transaction.partialSign(keypair);
//   //   transaction.feePayer = keypair.publicKey;
//   //   const txid = await connection.sendRawTransaction(transaction.serialize(), {
//   //     skipPreflight: true,
//   //     maxRetries: 5,
//   //   });
//   //   console.log('Transaction: ', txid);

//   //   await connection.confirmTransaction(txid);

//   //   const info = await connection.getTransaction(txid);
//   //   if (info != null) {
//   //     const sequence = parseSequenceFromLogSolana(info);
//   //     const emitterAddress = await getEmitterAddressSolana(
//   //       SOL_TOKEN_BRIDGE_ADDRESS
//   //     );

//   //     const vaaURL = `${WORMHOLE_RPC_HOST}/v1/signed_vaa/${CHAIN_ID_SOLANA}/${emitterAddress}/${sequence}`;
//   //     console.log('Searching for: ', vaaURL);
//   //     let vaaBytes = await (await fetch(vaaURL)).json();
//   //     while (!vaaBytes.vaaBytes) {
//   //       console.log('VAA not found, retrying in 5s!');
//   //       await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
//   //       vaaBytes = await (await fetch(vaaURL)).json();
//   //     }

//   //     // create a signer for Eth
//       const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL);
//   //     const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider);

//   //     // Convert the base64-encoded string to a Buffer object
//   //     const buffer = Buffer.from(vaaBytes.vaaBytes, 'base64');

//   //     // Create a Uint8Array from the Buffer object
//   //     const signedVAA = new Uint8Array(buffer);

//   //     const wrappedTokenAddress = await redeemOnEth(
//   //       CONTRACTS.TESTNET.ethereum.token_bridge,
//   //       signer,
//   //       signedVAA
//   //     );
//   //     console.log('Transaction Hash: ', wrappedTokenAddress.transactionHash);

//   //     let transferCompleted = await getIsTransferCompletedEth(
//   //       CONTRACTS.TESTNET.ethereum.token_bridge,
//   //       provider,
//   //       signedVAA
//   //     );

//   //     console.log('VAA Relayed!', transferCompleted);

//   //     provider.destroy();
//   //   }

//   //   await Promise.resolve();
//   //   assert.ok(true);
//   // });

//    it('Send Solana SPL Token to Ethereum', async () => {
//     // create a signer for Eth
//     const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL);
//     const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider);
//     const targetAddress = await signer.getAddress();

//     const amount: bigint = ethers.utils.parseUnits('0.0011', 9).toBigInt();

//     // Submit transaction - results in a Wormhole message being published
//     const transaction = await transferNativeSol(
//       connection,
//       new PublicKey(CONTRACTS.MAINNET.solana.core),
//       new PublicKey(CONTRACTS.MAINNET.solana.token_bridge),
//       keypair.publicKey,
//       amount,
//       tryNativeToUint8Array(targetAddress, CHAIN_ID_ETH),
//       CHAIN_ID_ETH
//     );

//     // sign, send, and confirm transaction
//     transaction.partialSign(keypair);
//     transaction.feePayer = keypair.publicKey;
//     const txid = await connection.sendRawTransaction(transaction.serialize(), {
//       skipPreflight: true,
//       maxRetries: 5,
//     });
//     console.log('Transaction: ', txid);

//     await connection.confirmTransaction(txid);

//     const info = await connection.getTransaction(txid);
    
//     if (info != null) {
//       const sequence = parseSequenceFromLogSolana(info);
//       const emitterAddress = await getEmitterAddressSolana(
//         SOL_TOKEN_BRIDGE_ADDRESS
//       );

//       const vaaURL = `${WORMHOLE_RPC_HOST}/v1/signed_vaa/${CHAIN_ID_SOLANA}/${emitterAddress}/${sequence}`;
//       console.log('Searching for: ', vaaURL);
//       let vaaBytes = await (await fetch(vaaURL)).json();
//       while (!vaaBytes.vaaBytes) {
//         console.log('VAA not found, retrying in 5s!');
//         await new Promise((r) => setTimeout(r, 5000)); //Timeout to let Guardiand pick up log and have VAA ready
//         vaaBytes = await (await fetch(vaaURL)).json();
//       }

//       // create a signer for Eth
//       const provider = new ethers.providers.WebSocketProvider(ETH_NODE_URL);
//       const signer = new ethers.Wallet(ETH_PRIVATE_KEY, provider);

//       // Convert the base64-encoded string to a Buffer object
//       const buffer = Buffer.from(vaaBytes.vaaBytes, 'base64');

//       // Create a Uint8Array from the Buffer object
//       const signedVAA = new Uint8Array(buffer);

//       const wrappedTokenAddress = await redeemOnEth(
//         CONTRACTS.TESTNET.ethereum.token_bridge,
//         signer,
//         signedVAA
//       );
//       console.log('Transaction Hash: ', wrappedTokenAddress.transactionHash);

//       let transferCompleted = await getIsTransferCompletedEth(
//         CONTRACTS.TESTNET.ethereum.token_bridge,
//         provider,
//         signedVAA
//       );

//       console.log('VAA Relayed!', transferCompleted);

//       provider.destroy();
//     }

//     await Promise.resolve();
//     assert.ok(true);
//   });
// });
