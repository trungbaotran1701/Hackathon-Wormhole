import IonIcon from '@sentre/antd-ionicon'
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  Keypair,
  SystemProgram,
  Transaction,
  Connection,
} from '@solana/web3.js'

import { Image, Col, Layout, Row, Space, Typography, Button } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import logo from 'static/images/solanaLogo.svg'
import brand from 'static/images/solanaLogoMark.svg'
import './index.less'
import idl from './idl.json'
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor'
import {
  createCheckpointAndWormhole,
  createMission,
  initUser,
  testDataCheckpoint,
} from 'function'

function View() {
  //Anchor
  const wallet = useAnchorWallet()
  async function getProvider() {
    if (!wallet) {
      return null
    }

    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = 'http://127.0.0.1:8899'
    const connection = new Connection(network, 'processed')

    const provider = new AnchorProvider(connection, wallet, {
      skipPreflight: true,
      commitment: 'processed',
    })
    return { provider, connection }
  }

  async function handleInitUser() {
    const { provider, connection } = await getProvider()
    if (!provider) {
      throw 'Provider is null'
    }

    const a = JSON.stringify(idl)
    const b = JSON.parse(a)
    const program = new Program(b, idl.metadata.address, provider)
    const programId = new web3.PublicKey(idl.metadata.address)
    try {
      const { userAccount, pdaUser } = await initUser(
        program,
        programId,
        wallet,
      )
      await createMission(userAccount, program, wallet, pdaUser, programId)

      await createCheckpointAndWormhole(
        userAccount,
        program,
        wallet,
        pdaUser,
        programId,
        connection,
      )

      // const pdaCheckpointAccount = await program.account.checkpoint.fetch(
      //   '3UPQuf7ZLNGa59JphSA6Q1ZXV9gzA4dEBWJWBmkVo4bY',
      // )

      // console.log(pdaCheckpointAccount)

      // const pdaCheckpointDataInitAccount =
      //   await program.account.checkpointDataInit.fetch(
      //     'DV7y3aUsj5BPPG1hnCTq3o97m3Z4kRmdAZRZ2hfG9p7B',
      //   )
      // console.log(pdaCheckpointDataInitAccount)

      // const pdaWormholeMaxAccount = await program.account.wormholeMax.fetch(
      //   '5Rk3sV8hLj2w3oSNQh3gR2iKxFVuEZTMRjDr4NkBJ6xD',
      // )
      // console.log(pdaWormholeMaxAccount)

      // const pdaWormholePayloadAccount =
      //   await program.account.wormholePayload.fetch(
      //     'DcRX4mLUQbq5ovzShGu8shwZ62eDKo4X5JVCyDaYTUKa',
      //   )
      // console.log(pdaWormholePayloadAccount)

      // Pause for 5 seconds
      await sleep(5000)

      await testDataCheckpoint(userAccount, program, wallet, programId)
    } catch (err) {
      console.log(err)
    }
  }

  function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  //normal
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)

  const getMyBalance = useCallback(async () => {
    if (!publicKey) return setBalance(0)
    // Read on-chain balance
    const lamports = await connection.getBalance(publicKey)
    return setBalance(lamports)
  }, [connection, publicKey])

  const airdrop = useCallback(async () => {
    try {
      setLoading(true)
      if (publicKey) {
        // Request SOL airdrop
        await connection.requestAirdrop(publicKey, 10 ** 10)
        // Reload balance
        return getMyBalance()
      }
    } catch (er: any) {
      console.log(er.message)
    } finally {
      return setLoading(false)
    }
  }, [connection, publicKey, getMyBalance])

  const transfer = useCallback(async () => {
    try {
      setLoading(true)
      if (publicKey) {
        // Create a "transfer" instruction
        const instruction = SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 10 ** 8,
        })
        // Create a transaction and add the instruction intot it
        const transaction = new Transaction().add(instruction)
        // Wrap on-chain info to the transaction
        const {
          context: { slot: minContextSlot },
          value: { blockhash, lastValidBlockHeight },
        } = await connection.getLatestBlockhashAndContext()
        // Send and wait for the transaction confirmed
        const signature = await sendTransaction(transaction, connection, {
          minContextSlot,
        })
        await connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        })
        // Reload balance
        return getMyBalance()
      }
    } catch (er: any) {
      console.log(er.message)
    } finally {
      return setLoading(false)
    }
  }, [connection, publicKey, getMyBalance, sendTransaction])

  useEffect(() => {
    getMyBalance()
  }, [getMyBalance])

  return (
    <Layout className="container">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Row gutter={[24, 24]}>
            <Col flex="auto">
              <img alt="logo" src={brand} height={16} />
            </Col>
            <Col>
              <WalletMultiButton />
            </Col>
          </Row>
        </Col>
        <Col span={24} style={{ textAlign: 'center' }}>
          <Space direction="vertical" size={24}>
            <Image src={logo} preview={false} width={256} />
            <Typography.Title level={1}>React + Solana = DApp</Typography.Title>
            <Typography.Text type="secondary">
              <Space>
                <IonIcon name="logo-react" />
                +
                <IonIcon name="logo-solana" />
                =
                <IonIcon name="rocket" />
              </Space>
            </Typography.Text>
            <Typography.Title>
              My Balance: {balance / 10 ** 9} SOL
            </Typography.Title>
            <Space>
              <Button
                type="primary"
                size="large"
                onClick={airdrop}
                loading={loading}
              >
                Airdrop
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={transfer}
                loading={loading}
              >
                Transfer
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleInitUser}
                loading={loading}
              >
                Handle init user
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>
    </Layout>
  )
}

export default View
