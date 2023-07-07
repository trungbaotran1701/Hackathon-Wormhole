import * as web3 from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

export const initProviderMax = async (
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

  //Pda provider max
  let [pdaProviderMax, bumpProviderMax] =
    await web3.PublicKey.findProgramAddress(
      [keypair.publicKey.toBuffer(), Buffer.from("provider")],
      programId
    );

  await workflowProgram.methods
    .initProviderMax()
    .accounts({
      authority: keypair.publicKey,
      providerMax: pdaProviderMax,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  const providerMaxAccount = await workflowProgram.account.providerMax.fetch(
    pdaProviderMax
  );

  return { providerMaxAccount, keypair, pdaProviderMax };
};

export const initProviders = async (
  providerMaxAccount: any,
  workflowProgram: any,
  keypair: any,
  programId: any
) => {
  //Pda provider max
  let [pdaProviderMax, bumpProviderMax] =
    await web3.PublicKey.findProgramAddress(
      [keypair.publicKey.toBuffer(), Buffer.from("provider")],
      programId
    );

  //Pda provider
  let providerListId = new Uint32Array([providerMaxAccount.maxListProvider]);
  let [pdaProvider, bumpProvider] = await web3.PublicKey.findProgramAddress(
    [
      keypair.publicKey.toBuffer(),
      Buffer.from(providerListId),
      Buffer.from("provider"),
    ],
    programId
  );

  await workflowProgram.methods
    .initProvider()
    .accounts({
      authority: keypair.publicKey,
      providerMax: pdaProviderMax,
      providers: pdaProvider,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc({ skipPreflight: true });

  //Fetch data from providers
  const pdaProvidersAccount = await workflowProgram.account.provider.fetch(
    pdaProvider
  );
  console.log("======init provider======");
  console.log(pdaProvidersAccount);

  return { pdaProvidersAccount };
};

export const addProvider = async (
  providerMaxAccount: any,
  workflowProgram: any,
  keypair: any,
  programId: any
) => {
  //Pda provider
  let providerListId = new Uint32Array([providerMaxAccount.maxListProvider]);
  let [pdaProvider, bumpProvider] = await web3.PublicKey.findProgramAddress(
    [
      keypair.publicKey.toBuffer(),
      Buffer.from(providerListId),
      Buffer.from("provider"),
    ],
    programId
  );

  //Data add provider
  let nameProvider = "Ethereum";
  let addressProvider = "2UAQDHdZRYsbUkJnTzmLdCpG4tM8rn42xkhY2aoibqmJ";

  const tx = await workflowProgram.methods
    .addProvider(nameProvider, addressProvider)
    .accounts({
      authority: keypair.publicKey,
      providers: pdaProvider,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  //Fetch data from providers
  const pdaProvidersAccount = await workflowProgram.account.provider.fetch(
    pdaProvider
  );
  console.log("======after add provider======");
  console.log(pdaProvidersAccount);

  return { pdaProvidersAccount };
};

export const editProvider = async (
  providerMaxAccount: any,
  workflowProgram: any,
  keypair: any,
  programId: any
) => {
  //Pda provider
  let providerListId = new Uint32Array([providerMaxAccount.maxListProvider]);
  let [pdaProvider, bumpProvider] = await web3.PublicKey.findProgramAddress(
    [
      keypair.publicKey.toBuffer(),
      Buffer.from(providerListId),
      Buffer.from("provider"),
    ],
    programId
  );

  // Data edit provider
  let editNameProvider = "Ethereum";
  let editAddressProvider = "Hehehe";

  const tx = await workflowProgram.methods
    .editProvider(editNameProvider, editAddressProvider)
    .accounts({
      authority: keypair.publicKey,
      providers: pdaProvider,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();

  const pdaProvidersAccount = await workflowProgram.account.provider.fetch(
    pdaProvider
  );
  console.log("======after edit provider======");
  console.log(pdaProvidersAccount);

  return { pdaProvidersAccount };
};
