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

import './style.css'

function View() {
  //Anchor
  const wallet = useAnchorWallet()
  async function getProvider() {
    if (!wallet) {
      return null
    }

    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = 'https://api.devnet.solana.com'
    const connection = new Connection(network, 'processed')

    const provider = new AnchorProvider(connection, wallet, {
      skipPreflight: true,
      commitment: 'processed',
    })
    return { provider, connection }
  }

  const onFinish = (e: any) => {
    console.log('hehe')
    console.log(e)
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
          </Space>
        </Col>
      </Row>
      <Form onFinish={onFinish} className="form-container">
        <Form.Item label="From" name="from" className="w-full">
          <Input placeholder="Ethereum address" className="rounded-md" />
        </Form.Item>
        <Form.Item label="To" name="to" className="w-full">
          <Input placeholder="Ethereum address" className="rounded-md" />
        </Form.Item>
        <Form.Item label="Token address" name="tokenAddress" className="w-full">
          <Input placeholder="Ethereum address" className="rounded-md" />
        </Form.Item>
        <Form.Item label="Amount" name="amount" className="w-full">
          <Input
            placeholder="Amount of tokens you want to transfer"
            className="rounded-md"
          />
        </Form.Item>
        <Form.Item className="flex justify-center">
          <Button block type="primary" htmlType="submit" className="rounded-md">
            Send Message
          </Button>
        </Form.Item>
      </Form>
    </Layout>
  )
}

export default View
