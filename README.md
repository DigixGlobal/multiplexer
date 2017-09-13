# Multiplexer

See `/build/contracts/Multiplexer.json` for deployment details.

## Usage

You must pass an array of addresses and an array of values to send to those addresses (by index)

### Send Ether

```
function sendEth(address[] _to, uint256[] _value) payable returns (bool _success)
```

### Send ERC20 Tokens

First you must `approve` the multiplexer contract address with enough tokens to process your request

```
function sendErc20(address _tokenAddress, address[] _to, uint256[] _value) returns (bool _success)
```
