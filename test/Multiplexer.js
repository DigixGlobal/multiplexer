/* eslint-disable max-len */
const crypto = require('crypto');

const Multiplexer = artifacts.require('./Multiplexer.sol');
const ERC20 = artifacts.require('./TestMintableToken.sol');

const bn = web3.toBigNumber;

function getBalance(address) {
  return new Promise((resolve) => {
    web3.eth.getBalance(address, (e, res) => resolve(res));
  });
}

function getBalances(addresses) {
  return Promise.all(addresses.map(getBalance));
}

function getTokenBalance(token, address) {
  return token.balanceOf.call(address);
}

function getTokenBalances(token, addresses) {
  return Promise.all(addresses.map(a => getTokenBalance(token, a)));
}


function randomAddress() {
  return `0x${crypto.randomBytes(20).toString('hex')}`;
}

function randomAddresses(n) {
  return Array(n).fill().map(randomAddress);
}

contract('Multiplexer', ([from]) => {
  let multiplexer;
  before(async () => {
    multiplexer = await Multiplexer.new();
  });
  describe('sendEth', () => {
    it('sends to a few users', async () => {
      const amounts = [1, 2, 3];
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getBalances(recipients);
      await multiplexer.sendEth(recipients, amounts, { value });
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i].add(amounts[i])));
      assert.deepEqual(await getBalance(multiplexer.address), bn(0));
    });
    it('sends to a lot of users', async () => {
      const amounts = Array.from(Array(100).keys());
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getBalances(recipients);
      await multiplexer.sendEth(recipients, amounts, { value });
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i].add(amounts[i])));
      assert.deepEqual(await getBalance(multiplexer.address), bn(0));
    });
    it('returns to sender when sending more value', async () => {
      const amounts = [1, 2, 3, 20];
      const actualValue = amounts.reduce((n, a) => n + a, 0);
      const value = 200;
      const senderBalance = await getBalance(from);
      const recipients = randomAddresses(amounts.length);
      const before = await getBalances(recipients);
      const gasPrice = 4e9;
      const { receipt: { gasUsed } } = await multiplexer.sendEth(recipients, amounts, { value, gasPrice });
      const gasCost = gasPrice * gasUsed;
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i].add(amounts[i])));
      assert.deepEqual(await getBalance(multiplexer.address), bn(0));
      assert.deepEqual(await getBalance(from), senderBalance.sub(gasCost).minus(actualValue));
    });
    it('throws when sending to too many users (out of gas)', async () => {
      const amounts = Array.from(Array(200).keys());
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getBalances(recipients);
      let thrown = false;
      try {
        await multiplexer.sendEth(recipients, amounts, { value });
      } catch (e) {
        thrown = true;
      }
      assert.equal(thrown, true);
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i]));
      assert.deepEqual(await getBalance(multiplexer.address), bn(0));
    });
    it('throws when sending to too many users (greater than uint8)', async () => {
      const amounts = Array.from(Array(256).keys());
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getBalances(recipients);
      let thrown = false;
      try {
        await multiplexer.sendEth(recipients, amounts, { value });
      } catch (e) {
        thrown = true;
      }
      assert.equal(thrown, true);
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i]));
      assert.deepEqual(await getBalance(multiplexer.address), bn(0));
    });
    it('throws when not sending enough value', async () => {
      const amounts = [1, 2, 3];
      const recipients = randomAddresses(amounts.length);
      const before = await getBalances(recipients);
      let thrown = false;
      try {
        await multiplexer.sendEth(recipients, amounts, { value: 3 });
      } catch (e) {
        thrown = true;
      }
      assert.equal(thrown, true);
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i]));
      assert.deepEqual(await getBalance(multiplexer.address), bn(0));
    });
  });

  describe('sendErc20', () => {
    const initialTokens = 5000;
    let erc20;
    beforeEach(async () => {
      erc20 = await ERC20.new();
      await erc20.mint(from, initialTokens);
    });
    it('sends to a few users', async () => {
      const amounts = [1, 2, 3];
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getTokenBalances(erc20, recipients);
      await erc20.approve(multiplexer.address, value);
      await multiplexer.sendErc20(erc20.address, recipients, amounts);
      const after = await getTokenBalances(erc20, recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i].add(amounts[i])));
      assert.deepEqual(await getTokenBalance(erc20, from), bn(initialTokens - value));
    });
    it('sends to a lot of users', async () => {
      const amounts = Array.from(Array(100).keys());
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getTokenBalances(erc20, recipients);
      await erc20.approve(multiplexer.address, value);
      await multiplexer.sendErc20(erc20.address, recipients, amounts);
      const after = await getTokenBalances(erc20, recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i].add(amounts[i])));
      assert.deepEqual(await getTokenBalance(erc20, from), bn(initialTokens - value));
    });
    it('throws when sending to too many users (out of gas)', async () => {
      const amounts = Array.from(Array(200).keys());
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getTokenBalances(erc20, recipients);
      await erc20.approve(multiplexer.address, value);
      let thrown = false;
      try {
        await multiplexer.sendErc20(erc20.address, recipients, amounts);
      } catch (e) {
        thrown = true;
      }
      assert.equal(thrown, true);
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i]));
      assert.deepEqual(await getTokenBalance(erc20, from), bn(initialTokens));
    });
    it('throws when sending to too many users (greater than uint8)', async () => {
      const amounts = Array.from(Array(256).keys());
      const value = amounts.reduce((n, a) => n + a, 0);
      const recipients = randomAddresses(amounts.length);
      const before = await getTokenBalances(erc20, recipients);
      await erc20.approve(multiplexer.address, value);
      let thrown = false;
      try {
        await multiplexer.sendErc20(erc20.address, recipients, amounts);
      } catch (e) {
        thrown = true;
      }
      assert.equal(thrown, true);
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i]));
      assert.deepEqual(await getTokenBalance(erc20, from), bn(initialTokens));
    });
    it('throws when not approved enough', async () => {
      const amounts = [1, 2, 3];
      const recipients = randomAddresses(amounts.length);
      const before = await getTokenBalances(erc20, recipients);
      await erc20.approve(multiplexer.address, 2);
      let thrown = false;
      try {
        await multiplexer.sendErc20(erc20.address, recipients, amounts);
      } catch (e) {
        thrown = true;
      }
      assert.equal(thrown, true);
      const after = await getBalances(recipients);
      amounts.forEach((a, i) => assert.deepEqual(after[i], before[i]));
      assert.deepEqual(await getTokenBalance(erc20, from), bn(initialTokens));
    });
  });
});
