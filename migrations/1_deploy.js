var Multiplexer = artifacts.require("./Multiplexer.sol");

module.exports = function(deployer) {
  if (process.env.RUN_SCRIPT) { return null; }
  deployer.deploy(Multiplexer);
};
