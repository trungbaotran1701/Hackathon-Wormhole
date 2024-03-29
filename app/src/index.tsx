import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import View from 'view'
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import {
  Coin98WalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

// import configs from 'configs'
import reportWebVitals from 'reportWebVitals'

import 'static/styles/index.less'

// const {
//   rpc: { endpoint },
// } = configs

createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <ConnectionProvider endpoint={'https://api.devnet.solana.com'}>
      <WalletProvider
        wallets={[new PhantomWalletAdapter(), new SolflareWalletAdapter()]}
        autoConnect
      >
        <WalletModalProvider>
          <View />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </BrowserRouter>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
