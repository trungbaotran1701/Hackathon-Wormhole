import * as anchor from '@project-serum/anchor'
import * as web3 from '@solana/web3.js'
import * as borsh from '@project-serum/borsh'
import { missionWithPositions } from '../demo_mission'
import { BN } from 'bn.js'
import { getTxSize } from './get_txsize'
import { assert } from 'chai'
import { AnchorWallet } from '@solana/wallet-adapter-react'
const Transaction = anchor.web3.Transaction

export const createCheckpointAndWormhole = async (
  userAccount: any,
  program: any,
  wallet: AnchorWallet,
  pdaUser: any,
  programId: any,
  connection: any,
) => {
  let missionId = new Uint32Array([userAccount.maxMissionId])
  let checkpoints = missionWithPositions.checkpoints
  let transactions = [new Transaction()]

  for (
    let indexCheckpoint = 0;
    indexCheckpoint < checkpoints.length;
    indexCheckpoint++
  ) {
    // Pda checkpoint
    let checkpointIdForPDA = new anchor.BN(indexCheckpoint).toArrayLike(
      Buffer,
      'le',
      2,
    )

    let [pdaCheckpoint, bumpCheckpoint] =
      await web3.PublicKey.findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          Buffer.from(missionId),
          checkpointIdForPDA,
        ],
        programId,
      )

    console.log('pdaCheckpoint', pdaCheckpoint.toBase58())

    let [pdaCheckpointDataInit, bumpCheckpointDataInit] =
      await web3.PublicKey.findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          Buffer.from(missionId),
          checkpointIdForPDA,
          Buffer.from('data'),
        ],
        programId,
      )

    console.log('pdaCheckointDataInit', pdaCheckpointDataInit.toBase58())

    // Data create checkpoint
    let checkpointId = indexCheckpoint
    let maxLength = 365
    let maxLengthBN = new BN(maxLength)
    let metadata = 5
    let voteMachine = new web3.PublicKey(
      '9Nkg3Vc1AqBDyheEnc6WzCJzhWUpQtPUcv1nPMyhDhnE',
    )
    let children = checkpoints[indexCheckpoint]?.children

    //Define data checkpoint_data_init
    let dataInitBuffer = null
    if (checkpoints[indexCheckpoint].data) {
      const dataInitSchema = borsh.struct([
        borsh.vec(borsh.str(), 'options'),
        borsh.u8('max'),
      ])

      const buffer = Buffer.alloc(500)
      dataInitSchema.encode(checkpoints[indexCheckpoint]?.data, buffer)
      dataInitBuffer = buffer.slice(0, dataInitSchema.getSpan(buffer))
    }
    // Create checkpoint
    let txCheckpoint = await handleCreateCheckpoint(
      program,
      checkpointId,
      maxLengthBN,
      metadata,
      voteMachine,
      children,
      dataInitBuffer,
      wallet,
      pdaUser,
      pdaCheckpoint,
      pdaCheckpointDataInit,
    )

    // Function to add instruction to the current transaction and create new one if needed
    const addInstruction = (instruction: any) => {
      let currentTransaction = transactions[transactions.length - 1]
      currentTransaction.add(instruction)

      let size = getTxSize(currentTransaction, wallet.publicKey)
      if (size > 1232) {
        let newTransaction = new Transaction()
        let lastInstruction = currentTransaction.instructions.pop()
        newTransaction.instructions.push(lastInstruction)
        transactions.push(newTransaction)
      }
    }

    // Add checkpoint to the last transaction in the transactions array
    addInstruction(txCheckpoint)

    //check wormhole
    if (checkpoints[indexCheckpoint].wormhole) {
      console.log('Entered wormhole creation for checkpoint: ', indexCheckpoint)
      for (let [key, value] of Object.entries(
        checkpoints[indexCheckpoint].wormhole,
      )) {
        console.log('Entered wormhole creation for key: ', key)
        let wormholePayloads = value
        let chainIdForPDA = parseInt(key)
        let [pdaWormholeMax, bumpCheckpoint] =
          await web3.PublicKey.findProgramAddress(
            [
              wallet.publicKey.toBuffer(),
              Buffer.from(missionId),
              checkpointIdForPDA,
              Buffer.from('wormhole'),
              Buffer.from([chainIdForPDA]),
            ],
            programId,
          )

        console.log('pdaWormholeMax', pdaWormholeMax.toBase58())

        //create wormholeMax
        let txWormholeMax = await handleCreateWormholeMax(
          program,
          checkpointId,
          chainIdForPDA,
          wallet,
          pdaUser,
          pdaWormholeMax,
        )

        // Add wormholeMax to the last transaction in the transactions array
        addInstruction(txWormholeMax)

        for (
          let indexWormholePayload = 0;
          indexWormholePayload < wormholePayloads.length;
          indexWormholePayload++
        ) {
          const wormholePayloadSchema = borsh.struct([
            borsh.str('integrator_address'),
            borsh.str('payload'),
          ])
          const buffer = Buffer.alloc(500)
          wormholePayloadSchema.encode(
            wormholePayloads[indexWormholePayload],
            buffer,
          )
          let wormholePayloadBuffer = buffer.slice(
            0,
            wormholePayloadSchema.getSpan(buffer),
          )

          let [pdaWormholePayload, bumpCheckpoint] =
            await web3.PublicKey.findProgramAddress(
              [
                wallet.publicKey.toBuffer(),
                Buffer.from(missionId),
                checkpointIdForPDA,
                Buffer.from('wormhole'),
                Buffer.from([chainIdForPDA]),
                Buffer.from([indexWormholePayload]),
              ],
              programId,
            )

          console.log('pdaWormholePayload', pdaWormholePayload.toBase58())

          //create wormholePayload
          let txWormholePayload = await handleCreateWormholePayload(
            program,
            checkpointId,
            chainIdForPDA,
            wormholePayloadBuffer,
            wallet,
            pdaUser,
            pdaWormholeMax,
            pdaWormholePayload,
          )

          // Add wormholePayload to the last transaction in the transactions array
          addInstruction(txWormholePayload)
        }
      }
    } else {
      console.log('No wormhole creation for checkpoint: ', indexCheckpoint)
    }
  }

  console.log(transactions.length)

  for (const transaction of transactions) {
    // Send and confirm each transaction
    // const tx = await provider.sendAndConfirm(transaction)
    // console.log(`Transaction ${tx} confirmed`)
    let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey

    console.log(transaction)
  }

  const signedTransactions = await wallet.signAllTransactions(transactions)

  for (let stx of signedTransactions) {
    await connection.sendRawTransaction(stx.serialize(), {
      skipPreflight: true,
    })
  }
}

const handleCreateCheckpoint = async (
  program: any,
  checkpointId: any,
  maxLengthBN: any,
  metadata: any,
  voteMachine: any,
  children: any,
  dataInitBuffer: any,
  wallet: any,
  pdaUser: any,
  pdaCheckpoint: any,
  pdaCheckpointDataInit: any,
) => {
  const tx = await program.methods
    .createCheckpoint(
      checkpointId,
      maxLengthBN,
      metadata,
      voteMachine,
      children,
      dataInitBuffer,
    )
    .accounts({
      authority: wallet.publicKey,
      user: pdaUser,
      checkpoint: pdaCheckpoint,
      checkpointDataInit: pdaCheckpointDataInit,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .instruction()

  return tx
}

const handleCreateWormholeMax = async (
  program: any,
  checkpointId: any,
  chainIdForPDA: any,
  wallet: any,
  pdaUser: any,
  pdaWormholeMax: any,
) => {
  const tx = await program.methods
    .createWormholeMax(checkpointId, chainIdForPDA)
    .accounts({
      authority: wallet.publicKey,
      user: pdaUser,
      checkpointWormholeMax: pdaWormholeMax,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .instruction()

  return tx
}

const handleCreateWormholePayload = async (
  program: any,
  checkpointId: any,
  chainIdForPDA: any,
  wormholePayloadBuffer: any,
  wallet: any,
  pdaUser: any,
  pdaWormholeMax: any,
  pdaWormholePayload: any,
) => {
  const tx = await program.methods
    .createWormholePayload(checkpointId, chainIdForPDA, wormholePayloadBuffer)
    .accounts({
      authority: wallet.publicKey,
      user: pdaUser,
      checkpointWormholeMax: pdaWormholeMax,
      checkpointWormholePayload: pdaWormholePayload,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .instruction()

  return tx
}

export const testDataCheckpoint = async (
  userAccount: any,
  program: any,
  wallet: any,
  programId: any,
) => {
  let missionId = new Uint32Array([userAccount.maxMissionId])
  let checkpoints = missionWithPositions.checkpoints

  for (
    let indexCheckpoint = 0;
    indexCheckpoint < checkpoints.length;
    indexCheckpoint++
  ) {
    // Pda checkpoint
    let checkpointIdForPDA = new anchor.BN(indexCheckpoint).toArrayLike(
      Buffer,
      'le',
      2,
    )

    let [pdaCheckpoint, bumpCheckpoint] =
      await web3.PublicKey.findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          Buffer.from(missionId),
          checkpointIdForPDA,
        ],
        programId,
      )

    let [pdaCheckpointDataInit, bumpCheckpointDataInit] =
      await web3.PublicKey.findProgramAddress(
        [
          wallet.publicKey.toBuffer(),
          Buffer.from(missionId),
          checkpointIdForPDA,
          Buffer.from('data'),
        ],
        programId,
      )

    // fetch CheckpointAccount
    const pdaCheckpointAccount = await program.account.checkpoint.fetch(
      pdaCheckpoint,
    )

    let voteMachine = new web3.PublicKey(
      '9Nkg3Vc1AqBDyheEnc6WzCJzhWUpQtPUcv1nPMyhDhnE',
    )

    //write test for checkpoint
    // assert.equal(0, pdaCheckpointAccount.started)
    // assert.equal(365, pdaCheckpointAccount.maxLength)
    // assert.equal(5, pdaCheckpointAccount.metadata)
    // assert.deepEqual(voteMachine, pdaCheckpointAccount.voteMachine)
    // assert.deepEqual(
    //   checkpoints[indexCheckpoint].children,
    //   pdaCheckpointAccount.children,
    // )

    console.log(pdaCheckpointAccount)

    const pdaCheckpointDataInitAccount =
      await program.account.checkpointDataInit.fetch(pdaCheckpointDataInit)
    console.log(pdaCheckpointDataInitAccount)

    //write test for checkpoint_data_init
    //Define data checkpoint_data_init
    let dataInitBuffer = null
    if (checkpoints[indexCheckpoint].data) {
      const dataInitSchema = borsh.struct([
        borsh.vec(borsh.str(), 'options'),
        borsh.u8('max'),
      ])

      const buffer = Buffer.alloc(500)
      dataInitSchema.encode(checkpoints[indexCheckpoint]?.data, buffer)
      dataInitBuffer = buffer.slice(0, dataInitSchema.getSpan(buffer))
    }

    // assert.deepEqual(dataInitBuffer, pdaCheckpointDataInitAccount.data)

    //check wormhole
    if (checkpoints[indexCheckpoint].wormhole) {
      console.log('Entered wormhole creation for checkpoint: ', indexCheckpoint)
      for (let [key, value] of Object.entries(
        checkpoints[indexCheckpoint].wormhole,
      )) {
        console.log('Entered wormhole creation for key: ', key)
        let wormholePayloads = value
        let chainIdForPDA = parseInt(key)
        let [pdaWormholeMax, bumpCheckpoint] =
          await web3.PublicKey.findProgramAddress(
            [
              wallet.publicKey.toBuffer(),
              Buffer.from(missionId),
              checkpointIdForPDA,
              Buffer.from('wormhole'),
              Buffer.from([chainIdForPDA]),
            ],
            programId,
          )

        const pdaWormholeMaxAccount = await program.account.wormholeMax.fetch(
          pdaWormholeMax,
        )
        console.log(pdaWormholeMaxAccount)

        // assert.equal(value.length, pdaWormholeMaxAccount.max)

        for (
          let indexWormholePayload = 0;
          indexWormholePayload < wormholePayloads.length;
          indexWormholePayload++
        ) {
          let [pdaWormholePayload, bumpCheckpoint] =
            await web3.PublicKey.findProgramAddress(
              [
                wallet.publicKey.toBuffer(),
                Buffer.from(missionId),
                checkpointIdForPDA,
                Buffer.from('wormhole'),
                Buffer.from([chainIdForPDA]),
                Buffer.from([indexWormholePayload]),
              ],
              programId,
            )

          // Data wormhole payload
          const wormholePayloadSchema = borsh.struct([
            borsh.str('integrator_address'),
            borsh.str('payload'),
          ])
          const buffer = Buffer.alloc(500)
          wormholePayloadSchema.encode(
            wormholePayloads[indexWormholePayload],
            buffer,
          )
          let wormholePayloadBuffer = buffer.slice(
            0,
            wormholePayloadSchema.getSpan(buffer),
          )

          const pdaWormholePayloadAccount =
            await program.account.wormholePayload.fetch(pdaWormholePayload)
          console.log(pdaWormholePayloadAccount)

          // assert.deepEqual(
          //   wormholePayloadBuffer,
          //   pdaWormholePayloadAccount.payload,
          // )
        }
      }
    } else {
      console.log('No wormhole creation for checkpoint: ', indexCheckpoint)
    }
  }
}
