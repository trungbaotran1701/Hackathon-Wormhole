import * as anchor from '@project-serum/anchor'
import * as web3 from '@solana/web3.js'
import { missionWithPositions } from '../demo_mission'

export const createMission = async (
  userAccount: any,
  program: any,
  wallet: any,
  pdaUser: any,
  programId: any,
) => {
  // Pda Mission
  let missionId = new Uint32Array([userAccount.maxMissionId])
  const fixedNumberForCurrentVote = new Uint8Array([0x00, 0x00, 0xff, 0xff])
  const fixedNumberForUserSolana = new Uint8Array([0x00, 0x00, 0xff, 0xfe])
  const fixedNumberForUserWeb2 = new Uint8Array([0x00, 0x00, 0xff, 0xfd])
  const fixedNumberForUserSecp256k1 = new Uint8Array([0x00, 0x00, 0xff, 0xfc])

  let [pdaMission, bumpMission] = await web3.PublicKey.findProgramAddress(
    [wallet.publicKey.toBuffer(), Buffer.from(missionId)],
    programId,
  )

  let [pdaCurrentVoteData, bumpCurrentVoteData] =
    await web3.PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        Buffer.from(missionId),
        fixedNumberForCurrentVote,
      ],
      programId,
    )

  let [pdaMissionUserSolana, bumpMissionUserSolana] =
    await web3.PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        Buffer.from(missionId),
        fixedNumberForUserSolana,
      ],
      programId,
    )

  let [pdaMissionUserWeb2, bumpMissionUserWeb2] =
    await web3.PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        Buffer.from(missionId),
        fixedNumberForUserWeb2,
      ],
      programId,
    )

  let [pdaMissionUserSecp256k1, bumpMissionUserSecp256k1] =
    await web3.PublicKey.findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        Buffer.from(missionId),
        fixedNumberForUserSecp256k1,
      ],
      programId,
    )
  // Add your test here.
  await program.methods
    .createMission(missionWithPositions.checkpoints.length, 7)
    .accounts({
      authority: wallet.publicKey,
      user: pdaUser,
      mission: pdaMission,
      currentVoteData: pdaCurrentVoteData,
      missionUserSolana: pdaMissionUserSolana,
      missionUserWeb2: pdaMissionUserWeb2,
      missionUserSecp256k1: pdaMissionUserSecp256k1,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc()

  // fetch missionAccount
  const missionAccount = await program.account.mission.fetch(pdaMission)

  return { missionAccount }
}
