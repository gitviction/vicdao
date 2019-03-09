var CounterApp = artifacts.require("CounterApp.sol");
var VictionToken = artifacts.require("VictionToken.sol");
var GitViction = artifacts.require("GitViction.sol");

module.exports = function(deployer, accounts) {
  //deployer.deploy(CounterApp);
  deployer
    .deploy(VictionToken)
    .then(instance => {
      console.log(`minting tokens for ${accounts[2]} , ${accounts[3]}`);
      return Promise.all([
        instance.mintFor(accounts[2], 100e18),
        instance.mintFor(accounts[3], 150e18)
      ]);
    })
    .then(() => {
      return deployer.deploy(GitViction, VictionToken.address);
    });
};
