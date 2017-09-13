/* eslint-disable import/no-extraneous-dependencies */
const LightWalletProvider = require('@digix/truffle-lightwallet-provider');

const { KEYSTORE, PASSWORD } = process.env;

if (!KEYSTORE || !PASSWORD) { throw new Error('You must export KEYSTORE and PASSWORD (see truffle.js)'); }

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 6545,
      network_id: '*', // Match any network id
    },
    kovan: {
      provider: new LightWalletProvider({
        keystore: KEYSTORE,
        password: PASSWORD,
        rpcUrl: 'https://kovan.infura.io/',
        pollingInterval: 2000,
      }),
      network_id: '42',
    },
    mainnet: {
      provider: new LightWalletProvider({
        keystore: KEYSTORE,
        password: PASSWORD,
        rpcUrl: 'https://mainnet.infura.io/',
        pollingInterval: 5000,
      }),
      gas: 350000,
      gasPrice: 5e9,
      network_id: '1',
    },
  },
};
