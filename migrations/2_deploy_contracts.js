var VictionToken = artifacts.require("VictionToken.sol");
var GitViction = artifacts.require("GitViction.sol");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(VictionToken).then(function(token) {
        token.mintFor(accounts[2], 100e18);
        token.mintFor(accounts[3], 150e18);
        return deployer.deploy(GitViction, VictionToken.address);
    });
};
