export const NETWORK_CONFIG = {
  'core': {
    name: 'Core Blockchain Mainnet',
    chainId: '1116',
    symbol: 'CORE',
    wrappedNative: '0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f',
    router: '0x2C34490b5E30f3C6838aE59c8c5fE88F9B9fBc8A',  // FalcoX Router
    factory: '0x1a34538D5371e9437780FaB1c923FA21a6facbaA', // FalcoX Factory
    explorer: 'https://scan.coredao.org'
  }
};

export const DEX_CONFIG = {
  'core': [{
    name: 'FalcoX Swap',
    router: '0x2C34490b5E30f3C6838aE59c8c5fE88F9B9fBc8A',
    factory: '0x1a34538D5371e9437780FaB1c923FA21a6facbaA'
  }]
};

export const RPC_CONFIG = {
  nodes: {
    'core': ['https://rpc.coredao.org', 'https://rpc-core.icecreamswap.com', 'https://core.drpc.org', 'https://rpc.coredao.org/']
  },
  timeout: 10000,
  retries: 5,
  delay: 1000
};

export const TOKEN_PAIRS = {
  'core': {
    'WCORE': {
      address: '0x40375C92d9FAf44d2f9db9Bd9ba41a3317a2404f',
      name: 'Wrapped CORE'
    },
    'BUGS': {
      address: '0x892CCdD2624ef09Ca5814661c566316253353820',
      name: 'BUGS Token'
    },
    'ANCH': {
      address: '0x735C632F2e4e0D9E924C9b0051EC0c10BCeb6eAE',
      name: 'ANCH Token'
    }
  }
};