import * as anchor from '@project-serum/anchor'
import { AnchorWallet } from '@solana/wallet-adapter-react'
import * as web3 from '@solana/web3.js'

export const initUser = async (
  program: any,
  programId: any,
  wallet: AnchorWallet,
) => {
  let [pdaUser, bumpUser] = await web3.PublicKey.findProgramAddress(
    [wallet.publicKey.toBuffer()],
    programId,
  )

  await program.methods
    .initialize()
    .accounts({
      authority: wallet.publicKey,
      user: pdaUser,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc()

  const userAccount = await program.account.user.fetch(pdaUser)
  console.log(userAccount)

  return { userAccount, wallet, pdaUser }
}
