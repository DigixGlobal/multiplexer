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
        rpcUrl: 'http://192.168.1.2:8546/',
        pollingInterval: 2000,
        // debug: true,
      }),
      gas: 4600000,
      network_id: '42',
    },
  },
};
