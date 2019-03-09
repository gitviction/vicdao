pragma solidity ^0.4.24;

import './token/VictionToken.sol';
import '@aragon/os/contracts/apps/AragonApp.sol';

contract GitViction is AragonApp{

    uint256 public TIME_UNIT = 1;
    uint256 public PADD = 10;
    uint256 public CONV_ALPHA = 9 * PADD;
    uint256 public weight = 5;
    uint256 public max_funded = 20;  // from 100
    uint256 proposal_counter = 1;
    VictionToken public token;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public stakes_per_voter;

    struct Proposal {
        uint256 amount_commons;
        uint256 external_id;  // github issue id
        address beneficiary;  // gitcoin beneficiary
        uint256 staked_tokens;
        uint256 sent_ether;
        uint256 conviction_last;
        uint256 block_last;
        mapping(address => uint256) stakes_per_voter;
    }

    constructor (address viction_token) public {
        token = VictionToken(viction_token);
    }

    event ProposalAdded(uint256 id);
    event Staked(uint256 id, address voter, uint256 amount);
    event Withdrawn(uint256 id, address voter, uint256 amount);
    event ProposalPassed(uint256 id, uint256 conviction);

    function addProposal(
        uint256 _amount_commons,
        uint256 _external_id,
        address _beneficiary
    ) external {
        proposals[proposal_counter] = Proposal(
            _amount_commons,
            _external_id,
            _beneficiary,
            0,
            0,
            0,
            0
        );
    }

    function getProposal (uint256 id) view public returns (
        uint256,
        uint256,
        address,
        uint256,
        uint256,
        uint256,
        uint256
    ) {
        Proposal storage proposal = proposals[id];
        return (
            proposal.amount_commons,
            proposal.external_id,
            proposal.beneficiary,
            proposal.staked_tokens,
            proposal.sent_ether,
            proposal.conviction_last,
            proposal.block_last
        );
    }

    function getProposalVoterStake(uint256 id, address voter) view public returns (uint256) {
        return proposals[id].stakes_per_voter[voter];
    }

    function stakeToProposal(uint256 id, uint256 amount) external {
        // make sure user does not stake more than he has
        require(stakes_per_voter[msg.sender] + amount < token.balanceOf(msg.sender));
        uint256 old_staked = proposals[id].staked_tokens;
        proposals[id].stakes_per_voter[msg.sender] += amount;
        proposals[id].staked_tokens += amount;
        if (proposals[id].block_last == 0) {
            proposals[id].block_last = block.number - TIME_UNIT;
        }
        stakes_per_voter[msg.sender] += amount;
        calculateAndSetConviction(id, old_staked);
    }

    function withdrawFromProposal(uint256 id, uint256 amount) external {
        require(proposals[id].stakes_per_voter[msg.sender] >= amount);
        uint256 old_staked = proposals[id].staked_tokens;
        proposals[id].staked_tokens -= amount;
        stakes_per_voter[msg.sender] -= amount;
        calculateAndSetConviction(id, old_staked);
    }

    function sendToProposal(uint256 id) payable external {
        proposals[id].sent_ether += msg.value;
        proposals[id].beneficiary.transfer(msg.value);
    }

    function calculateAndSetConviction(uint256 id, uint256 old_staked) internal {
        Proposal storage proposal = proposals[id];
        // calculateConviction and store it
        uint256 conviction = calculateConviction(
            block.number - proposal.block_last,
            proposal.conviction_last,
            old_staked,
            proposal.staked_tokens
        );
        proposal.block_last = block.number;
        proposal.conviction_last = conviction;
        if (conviction > calculateThreshold(proposal.amount_commons)) {
            emit ProposalPassed(id, conviction);
        }
    }

    function calculateConviction(uint256 time_passed, uint256 last_conv, uint256 old_amount, uint256 new_amount) view public returns(uint256 conviction) {
        uint256 steps = time_passed / TIME_UNIT;
        uint256 i;
        conviction = last_conv;
        for (i = 0; i < steps - 1; i++) {
            conviction = CONV_ALPHA * conviction / PADD + old_amount;
        }
        conviction = CONV_ALPHA * conviction / PADD + new_amount;
        return conviction;
    }

    function calculateThreshold(uint256 amount_commons) view public returns (uint256) {
        return 10;
        // - wS*log(β-r)
        // uint256 total_commons = address(this).balance;
        // return - weight * token.totalSupply() * log(max_funded - amount_commons / total_commons);
    }

    function log(uint256 number) view public returns (uint256) {
        return 2;
    }
}
