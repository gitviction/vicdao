var VictionToken = artifacts.require("VictionToken.sol");
var GitViction = artifacts.require("GitViction.sol");

module.exports = async function (deployer, network, accounts) {
    const instance = await deployer.deploy(VictionToken);

    console.log(`minting tokens for ${accounts[2]} , ${accounts[3]}`);
    await Promise.all([
        instance.mintFor(accounts[2], 100e18),
        instance.mintFor(accounts[3], 150e18)
    ]);

    await deployer.deploy(GitViction);
    GitViction.setToken(VictionToken.address, {from: accounts[0]});
};
