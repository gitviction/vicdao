const CounterApp = artifacts.require('CounterApp.sol')
const VictionToken = artifacts.require('VictionToken.sol')
const GitViction = artifacts.require('GitViction.sol')

const PROPKEYS = {
    AMOUNT: 0,
    ID: 1,
    ADDR: 2,
    STAKED: 3,
    ETH: 4,
    CONV: 5,
    BLOCK: 6,
}

function getConviction(alpha, lastConv, amount) {
    return (alpha * lastConv + amount).valueOf();
}

contract('CounterApp', (accounts) => {
    it('should be tested')
})

contract('GitViction', async (accounts) => {
    let victionT;
    let viction;
    let alpha, time_unit, weight, max_funded;
    let multiplier = Math.pow(10, 18);
    let mint0 = 100 * multiplier, mint1 = 50 * multiplier, mint2 = 10 * multiplier;
    let balance0, balance1, balance2, balance3;
    let proposal;
    let lastConv;
    let proposal1 = {
        amount: 5 * multiplier,
        id: 1234,
        address: accounts[4],
        stakes: [0.1 * multiplier, 0.5 * multiplier],
    }
    let proposal2 = {
        amount: 10 * multiplier,
        id: 1234,
        address: accounts[5],
    }
    it("big test", async () => {
        victionT = await VictionToken.deployed();
        viction = await GitViction.deployed(victionT.address);
        assert.equal(
            await viction.token(),
            victionT.address
        );

        alpha = await viction.CONV_ALPHA();
        time_unit = await viction.TIME_UNIT();
        weight = await viction.weight();
        max_funded = await viction.max_funded();
        console.log(alpha, time_unit, weight, max_funded);

        await victionT.mint(mint0, {from: accounts[0]});
        await victionT.mint(mint1, {from: accounts[1]});
        await victionT.mint(mint2, {from: accounts[2]});

        balance0 = await victionT.balanceOf.call(accounts[0]);
        assert.equal(
            balance0.valueOf(),
            mint0,
            "5 eth wasn't in the first account"
        );
        balance1 = await victionT.balanceOf.call(accounts[1]);
        assert.equal(
            balance1.valueOf(),
            mint1,
            "5 eth wasn't in the 2nd account"
        );
        balance2 = await victionT.balanceOf.call(accounts[2]);
        assert.equal(
            balance2.valueOf(),
            mint2,
            "5 eth wasn't in the 3rd account"
        );
        await viction.addProposal(proposal1.amount, proposal1.id, proposal1.address);
        proposal = await viction.getProposal(1);
        assert.equal(
            proposal[PROPKEYS.AMOUNT],
            proposal1.amount,
            `proposal1 amount not ${proposal1.amount}`
        );
        assert.equal(
            proposal[PROPKEYS.ID],
            proposal1.id,
            `proposal1 id not ${proposal1.id}`
        );
        assert.equal(
            proposal[PROPKEYS.ADDR],
            proposal1.address,
            `proposal1 address not ${proposal1.address}`
        );
        assert.equal(
            proposal[PROPKEYS.STAKED],
            0,
            `proposal1 staked_tokens not 0`
        );
        assert.equal(
            proposal[PROPKEYS.ETH],
            0,
            `proposal1 sent_ether not 0`
        );
        assert.equal(
            proposal[PROPKEYS.CONV],
            0,
            `proposal1 conviction_last not 0`
        );
        assert.equal(
            proposal[PROPKEYS.BLOCK],
            0,
            `proposal1 block_last not 0`
        );
        await viction.stakeToProposal(1, proposal1.stakes[0], {from: accounts[0]});
        assert.equal(
            proposal1.stakes[0],
            await viction.stakes_per_voter(accounts[0]),
            `stakes_per_voter for accounts[0] is not ${proposal1.stakes[0]}`,
        );
        proposal = await viction.getProposal(1);
        assert.equal(
            proposal1.stakes[0],
            proposal[PROPKEYS.STAKED],
            `stakes_per_voter for accounts[0] is not ${proposal1.stakes[0]}`,
        );
        assert.equal(
            proposal1.stakes[0],
            await viction.getProposalVoterStake(1, accounts[0]),
            `proposal stakes_per_voter for accounts[0] is not ${proposal1.stakes[0].valueOf()}`,
        );
        lastConv = getConviction(alpha, 0, proposal1.stakes[0]);
        console.log('proposal lastConv', proposal[PROPKEYS.CONV].valueOf());
        console.log('lastConv', lastConv);
        assert.equal(
            lastConv.valueOf(),
            proposal[PROPKEYS.CONV],
            `proposal stakes_per_voter for accounts[0] is not ${lastConv.valueOf()}`,
        );
    });
});
