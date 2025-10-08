export const FACTORY_ABI = [{
  "constant": true,
  "inputs": [{
    "internalType": "address",
    "name": "tokenA",
    "type": "address"
  }, {
    "internalType": "address",
    "name": "tokenB",
    "type": "address"
  }],
  "name": "getPair",
  "outputs": [{
    "internalType": "address",
    "name": "pair",
    "type": "address"
  }],
  "payable": false,
  "stateMutability": "view",
  "type": "function"
}];

export const PAIR_ABI = [{
  "constant": true,
  "inputs": [],
  "name": "getReserves",
  "outputs": [{
    "internalType": "uint112",
    "name": "reserve0",
    "type": "uint112"
  }, {
    "internalType": "uint112",
    "name": "reserve1",
    "type": "uint112"
  }, {
    "internalType": "uint32",
    "name": "blockTimestampLast",
    "type": "uint32"
  }],
  "payable": false,
  "stateMutability": "view",
  "type": "function"
}];

export const ROUTER_ABI = [{
  "inputs": [{
    "name": "amountOutMin",
    "type": "uint256"
  }, {
    "name": "path",
    "type": "address[]"
  }, {
    "name": "to",
    "type": "address"
  }, {
    "name": "deadline",
    "type": "uint256"
  }],
  "name": "swapExactETHForTokens",
  "outputs": [{
    "name": "amounts",
    "type": "uint256[]"
  }],
  "stateMutability": "payable",
  "type": "function"
}, {
  "inputs": [{
    "name": "amountIn",
    "type": "uint256"
  }, {
    "name": "path",
    "type": "address[]"
  }],
  "name": "getAmountsOut",
  "outputs": [{
    "name": "amounts",
    "type": "uint256[]"
  }],
  "stateMutability": "view",
  "type": "function"
}, {
  "inputs": [{
    "name": "amountIn",
    "type": "uint256"
  }, {
    "name": "amountOutMin",
    "type": "uint256"
  }, {
    "name": "path",
    "type": "address[]"
  }, {
    "name": "to",
    "type": "address"
  }, {
    "name": "deadline",
    "type": "uint256"
  }],
  "name": "swapExactTokensForETH",
  "outputs": [{
    "name": "amounts",
    "type": "uint256[]"
  }],
  "stateMutability": "nonpayable",
  "type": "function"
}, {
  "inputs": [{
    "name": "amountIn",
    "type": "uint256"
  }, {
    "name": "amountOutMin",
    "type": "uint256"
  }, {
    "name": "path",
    "type": "address[]"
  }, {
    "name": "to",
    "type": "address"
  }, {
    "name": "deadline",
    "type": "uint256"
  }],
  "name": "swapExactTokensForETHSupportingFeeOnTransferTokens",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}];

export const ERC20_ABI = [{
  "constant": true,
  "inputs": [{
    "name": "_owner",
    "type": "address"
  }, {
    "name": "_spender",
    "type": "address"
  }],
  "name": "allowance",
  "outputs": [{
    "name": "",
    "type": "uint256"
  }],
  "type": "function"
}, {
  "constant": false,
  "inputs": [{
    "name": "_spender",
    "type": "address"
  }, {
    "name": "_value",
    "type": "uint256"
  }],
  "name": "approve",
  "outputs": [{
    "name": "",
    "type": "bool"
  }],
  "type": "function"
}, {
  "constant": true,
  "inputs": [{
    "name": "_owner",
    "type": "address"
  }],
  "name": "balanceOf",
  "outputs": [{
    "name": "balance",
    "type": "uint256"
  }],
  "type": "function"
}, {
  "constant": false,
  "inputs": [{
    "name": "_to",
    "type": "address"
  }, {
    "name": "_value",
    "type": "uint256"
  }],
  "name": "transfer",
  "outputs": [{
    "name": "",
    "type": "bool"
  }],
  "type": "function"
}];