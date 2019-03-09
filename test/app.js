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

const calculateThreshold = function(weight, totalSupply, maxFunded, amountCommons, totalCommons) {
    console.log('calculateThreshold', weight, totalSupply, maxFunded, amountCommons, totalCommons, Math.log2(maxFunded - Math.floor(amountCommons / totalCommons)));
    return - weight * totalSupply * Math.log2(maxFunded - Math.floor(amountCommons / totalCommons));
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

contract('GitViction', async (accounts) => {
    let victionT;
    let viction;
    let alpha, timeUnit, weight, maxFunded;
    let multiplier = Math.pow(10, 18);
    let mint0 = 100 * multiplier, mint1 = 50 * multiplier, mint2 = 10 * multiplier;
    let balance0, balance1, balance2, balance3;
    let proposal;
    let lastConv;
    let threshold;
    let lastBlockNumber, currentBlockNumber;
    let proposal1 = {
        amount: 1 * multiplier,
        id: 1234,
        address: accounts[4],
        stakes: [0.1 * multiplier, 0.5 * multiplier],
    }
    let proposal2 = {
        amount: 2 * multiplier,
        id: 1234,
        address: accounts[5],
    }
    it("big test", async () => {
        victionT = await VictionToken.new({from: accounts[0]});
        viction = await GitViction.new({from: accounts[0]});

        await viction.setToken(victionT.address, {from: accounts[0]});
        assert.equal(
            await viction.token(),
            victionT.address
        );

        alpha = (await viction.CONV_ALPHA()) / (await viction.PADD());
        timeUnit = await viction.TIME_UNIT();
        weight = await viction.weight();
        maxFunded = await viction.max_funded() / (await viction.PADD());
        console.log(alpha, timeUnit, weight, maxFunded);

        // console.log('coinbase', web3.eth.coinbase, await web3.eth.getBalance(web3.eth.coinbase));

        // Send some ETH to GitViction - this is the total commons
        web3.eth.sendTransaction({from: accounts[6], to: viction.address, value: 100 * multiplier});
        web3.eth.sendTransaction({from: accounts[7], to: viction.address, value: 100 * multiplier});
        web3.eth.sendTransaction({from: accounts[8], to: viction.address, value: 100 * multiplier});
        web3.eth.sendTransaction({from: accounts[9], to: viction.address, value: 100 * multiplier});

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
        let totalSupply = await victionT.totalSupply();
        let totalB = balance0.plus(balance1).plus(balance2);
        assert.equal(
            totalSupply.valueOf(),
            totalB.valueOf(),
            `balance bad`,
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

        // Test log2
        assert.equal(
            await viction.log2(2),
            Math.log2(2),
            'Log2 should be 1',
        );
        assert.equal(
            await viction.log2(4),
            Math.log2(4),
            'Log2 should be 2',
        );
        assert.equal(
            await viction.log2(256),
            Math.log2(256),
            'Log2 should be 8',
        );
        let testValue = 8 - Math.floor(1000000000000000000 * 10 / 400000000000000000000);
        assert.equal(
            await viction.log2(testValue),
            Math.log2(testValue),
            `Log2 should be ${Math.log2(testValue)} instead of ${await viction.log2(testValue)}`,
        );

        // threshold = await viction.calculateThreshold(proposal1.amount);
        // let totalC = await web3.eth.getBalance(viction.address);
        // let jsThreshold = calculateThreshold(
        //     weight,
        //     await victionT.totalSupply(),
        //     maxFunded,
        //     proposal1.amount,
        //     totalC,
        // );
        // assert.equal(
        //     threshold,
        //     jsThreshold,
        //     `threshold calculation is wrong: got ${threshold}, expected ${jsThreshold}`,
        // );
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
