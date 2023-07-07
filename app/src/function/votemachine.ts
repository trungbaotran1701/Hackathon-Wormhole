import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

export const initVotemachineMax = async (
  workflowProgram: any,
  programId: any,
  provider: any
) => {
  const keypair = anchor.web3.Keypair.generate();

  await provider.connection
    .requestAirdrop(keypair.publicKey, 100000000000)
    .then((sig: any) =>
      provider.connection.confirmTransaction(sig, "confirmed")
    );

  //Pda votemachine max
  let [pdaVotemachineMax, bumpVotemachineMax] =
    await web3.PublicKey.findProgramAddress(
      [keypair.publicKey.toBuffer(), Buffer.from("votemachine")],
      programId
    );

  await workflowProgram.methods
    .initVotemachineMax()
    .accounts({
      authority: keypair.publicKey,
      votemachineMax: pdaVotemachineMax,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  const votemachineMaxAccount =
    await workflowProgram.account.votemachineMax.fetch(pdaVotemachineMax);

  return { votemachineMaxAccount, keypair, pdaVotemachineMax };
};

export const initVotemachine = async (
  votemachineMaxAccount: any,
  workflowProgram: any,
  keypair: any,
  programId: any
) => {
  //Pda votemachine max
  let [pdaVotemachineMax, bumpVotemachineMax] =
    await web3.PublicKey.findProgramAddress(
      [keypair.publicKey.toBuffer(), Buffer.from("votemachine")],
      programId
    );

  //pda votemachine
  let votemachineListId = new Uint32Array([
    votemachineMaxAccount.maxListVotemachine,
  ]);
  let [pdaVotemachine, bumpVotemachine] =
    await web3.PublicKey.findProgramAddress(
      [
        keypair.publicKey.toBuffer(),
        Buffer.from(votemachineListId),
        Buffer.from("votemachine"),
      ],
      programId
    );

  const tx = await workflowProgram.methods
    .initVotemachine()
    .accounts({
      authority: keypair.publicKey,
      votemachineMax: pdaVotemachineMax,
      votemachines: pdaVotemachine,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  //Fetch data from votemachines
  const pdaVotemachineAccount = await workflowProgram.account.votemachine.fetch(
    pdaVotemachine
  );
  console.log("======init votemachine======");
  console.log(JSON.stringify(pdaVotemachineAccount, null, 2));

  return { pdaVotemachineAccount };
};

export const addVotemachine = async (
  votemachineMaxAccount: any,
  workflowProgram: any,
  keypair: any,
  programId: any
) => {
  //pda votemachine
  let votemachineListId = new Uint32Array([
    votemachineMaxAccount.maxListVotemachine,
  ]);
  let [pdaVotemachine, bumpVotemachine] =
    await web3.PublicKey.findProgramAddress(
      [
        keypair.publicKey.toBuffer(),
        Buffer.from(votemachineListId),
        Buffer.from("votemachine"),
      ],
      programId
    );

  // data add votemachine
  let votemachineAddress = new anchor.web3.PublicKey(
    "2UAQDHdZRYsbUkJnTzmLdCpG4tM8rn42xkhY2aoibqmJ"
  );

  let votemachineStatus = 0;
  const tx = await workflowProgram.methods
    .addVotemachine(votemachineAddress, votemachineStatus)
    .accounts({
      authority: keypair.publicKey,
      votemachines: pdaVotemachine,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();
  const pdaVotemachineAccount = await workflowProgram.account.votemachine.fetch(
    pdaVotemachine
  );
  console.log("======after add votemachine======");
  console.log(JSON.stringify(pdaVotemachineAccount, null, 2));
};

export const editVotemachine = async (
  votemachineMaxAccount: any,
  workflowProgram: any,
  keypair: any,
  programId: any
) => {
  //pda votemachine
  let votemachineListId = new Uint32Array([
    votemachineMaxAccount.maxListVotemachine,
  ]);
  let [pdaVotemachine, bumpVotemachine] =
    await web3.PublicKey.findProgramAddress(
      [
        keypair.publicKey.toBuffer(),
        Buffer.from(votemachineListId),
        Buffer.from("votemachine"),
      ],
      programId
    );

  // data edit votemachine
  let editVotemachineAddress = new anchor.web3.PublicKey(
    "2UAQDHdZRYsbUkJnTzmLdCpG4tM8rn42xkhY2aoibqmJ"
  );
  let editVotemachineStatus = 1;

  const tx = await workflowProgram.methods
    .editVotemachine(editVotemachineAddress, editVotemachineStatus)
    .accounts({
      authority: keypair.publicKey,
      votemachines: pdaVotemachine,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  const pdaVotemachineAccount = await workflowProgram.account.votemachine.fetch(
    pdaVotemachine
  );
  console.log("======after edit votemachine======");
  console.log(JSON.stringify(pdaVotemachineAccount, null, 2));
};
