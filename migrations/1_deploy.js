var Multiplexer = artifacts.require("./Multiplexer.sol");

module.exports = function(deployer) {
  deployer.deploy(Multiplexer);
};
