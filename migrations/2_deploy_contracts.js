var CounterApp = artifacts.require('CounterApp.sol')
var VictionToken = artifacts.require('VictionToken.sol')
var GitViction = artifacts.require('GitViction.sol')

module.exports = function (deployer) {
    deployer.deploy(CounterApp)
    deployer.deploy(VictionToken).then(() => {
        return deployer.deploy(GitViction, VictionToken.address);
    });
}
