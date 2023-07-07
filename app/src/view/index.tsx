import IonIcon from '@sentre/antd-ionicon'
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Connection } from '@solana/web3.js'

import {
  Image,
  Col,
  Layout,
  Row,
  Space,
  Typography,
  Button,
  Form,
  Input,
  Radio,
} from 'antd'
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

type LayoutType = Parameters<typeof Form>[0]['layout']

function View() {
  const [form] = Form.useForm()

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
            <Typography.Title level={1}>W + Solana = DApp</Typography.Title>
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
                onClick={handleInitUser}
                loading={loading}
              >
                Handle init user
              </Button>
            </Space>
          </Space>
        </Col>
      </Row>
      <Form form={form}>
        <Form.Item label="From">
          <Input placeholder="Ethereum address" />
        </Form.Item>
        <Form.Item label="To">
          <Input placeholder="Ethereum address" />
        </Form.Item>
        <Form.Item label="Token address">
          <Input placeholder="Ethereum address" />
        </Form.Item>
        <Form.Item label="Amount">
          <Input placeholder="Amount of tokens you want to transfer" />
        </Form.Item>
        <Form.Item>
          <Button type="primary">Send Message</Button>
        </Form.Item>
      </Form>
    </Layout>
  )
}

export default View
