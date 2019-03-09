const CounterApp = artifacts.require('CounterApp.sol')
const VictionToken = artifacts.require('VictionToken.sol')
const GitViction = artifacts.require('GitViction.sol')

const convictionFromLast = function (alpha, blocksPassed, timeUnit, lastConv, oldAmount, newAmount) {
    let conviction = lastConv;
    let timeSteps = Math.floor(blocksPassed / timeUnit);

    while (timeSteps > 1) {
        conviction = calculateConviction(alpha, conviction, oldAmount);
        timeSteps --;
    }
    conviction = calculateConviction(alpha, conviction, newAmount);
    return conviction;
}

const calculateConviction = function(alpha, lastConv, amount) {
    return (alpha * lastConv + amount);
}

const PROPKEYS = {
    AMOUNT: 0,
    ID: 1,
    ADDR: 2,
    STAKED: 3,
    ETH: 4,
    CONV: 5,
    BLOCK: 6,
}

contract('CounterApp', (accounts) => {
    it('should be tested')
})

contract('GitViction', async (accounts) => {
    let victionT;
    let viction;
    let alpha, timeUnit, weight, max_funded;
    let multiplier = Math.pow(10, 18);
    let mint0 = 100 * multiplier, mint1 = 50 * multiplier, mint2 = 10 * multiplier;
    let balance0, balance1, balance2, balance3;
    let proposal;
    let lastConv;
    let lastBlockNumber, currentBlockNumber;
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

        alpha = (await viction.CONV_ALPHA()) / (await viction.PADD());
        timeUnit = await viction.TIME_UNIT();
        weight = await viction.weight();
        max_funded = await viction.max_funded();
        console.log(alpha, timeUnit, weight, max_funded);

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
        lastBlockNumber = (await web3.eth.getBlock("latest")).number;
        assert.equal(
            lastBlockNumber,
            proposal[PROPKEYS.BLOCK],
            `last block is not ${lastBlockNumber}`,
        );
        assert.equal(
            proposal1.stakes[0],
            await viction.getProposalVoterStake(1, accounts[0]),
            `proposal stakes_per_voter for accounts[0] is not ${proposal1.stakes[0].valueOf()}`,
        );
        lastConv = convictionFromLast(
            alpha,
            timeUnit,
            timeUnit,
            0,
            0,
            proposal1.stakes[0]
        );
        assert.equal(
            lastConv.valueOf(),
            proposal[PROPKEYS.CONV],
            `proposal stakes_per_voter for accounts[0] is not ${lastConv.valueOf()}`,
        );
        await mineBlocks(2);
        await viction.stakeToProposal(1, proposal1.stakes[1], {from: accounts[1]});
        proposal = await viction.getProposal(1);
        currentBlockNumber = (await web3.eth.getBlock("latest")).number;
        lastConv = convictionFromLast(
            alpha,
            currentBlockNumber - lastBlockNumber,
            timeUnit,
            lastConv,
            proposal1.stakes[0],
            proposal1.stakes[0] + proposal1.stakes[1],
        );
        assert.equal(
            lastConv.valueOf(),
            proposal[PROPKEYS.CONV],
            `proposal lastConv for accounts[1] is not ${lastConv.valueOf()}`,
        );
    });
});

async function mineBlocks(numberOfBlocks) {
    console.log('before IB', (await web3.eth.getBlock("latest")).number);
    for (let i = 0; i < numberOfBlocks; i++) {
        await increaseTime(15);
    }
    console.log('after IB', (await web3.eth.getBlock("latest")).number);
}

function increaseTime(duration) {
  const id = Date.now();

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [duration],
        id: id
      },
      err1 => {
        if (err1) return reject(err1);

        web3.currentProvider.sendAsync(
          {
            jsonrpc: "2.0",
            method: "evm_mine",
            id: id + 1
          },
          (err2, res) => {
            return err2 ? reject(err2) : resolve(res);
          }
        );
      }
    );
  });
};
