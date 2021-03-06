import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import styled from "styled-components";
import { ethers } from 'ethers';
import {CONTRACTS} from './contracts';
import GitCoinButton from 'gitcoinbutton';
import {waitAsync} from './utils';

// import GitterCritter from "./GitterCrittter";
import {
  LineChart,
  Line,
  CartesianGrid,
  // Legend,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

window.ethers = ethers;

const VotingTable = styled.table`
  margin: auto;
  padding-top: 25vh;
`;

const TableRow = styled.tr``;

const TableData = styled.td`
  padding: 2rem;
`;

const TextInput = styled.input``;

const AppContainer = styled.main`
  align-items: center;
  justify-content: center;
`;

const data = [
  { name: "t1", conviction: 0, tokens: 0, total: 0 },
  { name: "t2", conviction: 0, tokens: 0, total: 0 },
  { name: "t3", conviction: 0, tokens: 1, total: 1 },
  { name: "t4", conviction: 0.5, tokens: 1, total: 1.5 },
  { name: "t5", conviction: 1, tokens: 2, total: 3 },
  { name: "t6", conviction: 1.5, tokens: 2, total: 3.5 },
  { name: "t7", conviction: 1, tokens: 0, total: 1 },
  { name: "t8", conviction: 0, tokens: 0, total: 0 }
];

export default class App extends React.Component {
  constructor(props) {
    super();
    this.state = {
      issues: []
    };
  }

  startVote(issue, amount) {
    console.log('startVte', issue, amount, issue.proposalid);
    amount = ethers.utils.bigNumberify(amount * Math.pow(10, 12)).mul(Math.pow(10, 5));
    this.viction.stakeToProposal(issue.proposalid, amount);
  }

  mintTokens() {
    const mint = ethers.utils.bigNumberify(10 * Math.pow(10, 12)).mul(5 * Math.pow(10, 6));
    const receipt = this.victionT.mint(mint).then(receipt => {
        console.log('receipt', receipt);
    });

  }

  async connectMetamask() {
      console.log('web3', window.web3);
      this.provider = new ethers.providers.Web3Provider(window.web3.currentProvider);
      this.signer = this.provider.getSigner();

      await waitAsync(1000);
      this.initializeContracts();
  }

  async initializeContracts() {
      const networkId = String(this.provider.network.chainId);

      this.viction = new ethers.Contract(
          CONTRACTS.viction.networks[networkId].address,
          CONTRACTS.viction.abi,
          this.signer,
      );

      this.victionT = new ethers.Contract(
          await this.viction.token(),
          CONTRACTS.victiont.abi,
          this.signer,
      );
      console.log(this.victionT, this.viction);
      this.getAllProposals();
  }

  componentDidMount() {
    this.connectMetamask();
    this.importFromGithub('');
  }

  async insertIssues(url) {
      await this.importFromGithub(url);
      this.insertProposals(this.state.issues);
  }

  importFromGithub(url) {
    // url = `https://api.${url.substring(8)}`;
    return axios
      .get(`https://api.github.com/repos/gitviction/vicdao/issues`)
      .then(res => {
        let issues = res.data
          .map(issue => {
            // parse issue body
            const voteData = issue.body.split(" ");
            let a = 0;
            let d = "ETH";
            if (voteData.length === 3 && voteData[0] === "voteonfunding") {
              a = parseInt(voteData[1]);
              d = voteData[2];
            }

            return {
              ...issue,
              amount: a,
              denomination: 'ETH',
              data: [],
            };
          })
          .reduce((accum, issue) => {
            // filter out items with no amount filled in
            if (issue.amount > 0) {
              accum.push(issue);
            }
            return accum;
          }, []);
          console.log('issues', issues);
        this.setState({ issues: issues }, () => {});
      })
      .catch(error => {});
  }

  async getAllProposals() {
      // let filter = this.viction.ProposalAdded(null);
      // console.log(filter)
      //   on('ProposalAdded', async (id) => {
      //     console.log('ProposalAdded', id);
      // });
    const logs = await this.provider.getLogs({
        fromBlock: 0,
        toBlock: "latest",
        address: this.viction.address,
    });
    let issues = [];
    for (const log of logs) {
        const parsedLog = this.viction.interface.parseLog(log);

        if (parsedLog.name === 'ProposalAdded') {
            let chainissue = await this.viction.getProposal(parsedLog.values.id);

            issues = this.state.issues.map(issue => {
                if (issue.id == chainissue[1].toNumber()) {
                    issue.proposalid = parsedLog.values.id;
                }
                return issue;
            });
        } else if (parsedLog.name === 'Staked' || parsedLog.name === 'Withdrawn') {
            console.log('parsedLog', parsedLog)
            const {id, voter, staked_tokens, conviction} = parsedLog.values;
            issues = this.state.issues.map(issue => {
                if (issue.proposalid.eq(id)) {
                    issue.data.push({
                        name: id,
                        conviction: conviction,
                        tokens: staked_tokens,
                        block: log.blockNumber,
                    });
                }
                return issue;
            });
        }
    }
    console.log('issues', issues);
    this.setState({ issues });
  }

  insertProposals(issues) {
     issues.forEach(issue => {
        let amount = ethers.utils.bigNumberify(issue.amount * Math.pow(10, 5))
            .mul(Math.pow(10, 12));
        // console.log('amount', amount)
        this.viction.addProposal(
            amount,
            issue.id,
            "0xbB5AEb01acF5b75bc36eC01f5137Dd2728FbE983",
        ).then(console.log);
    });
  }

  render() {
    const issues = this.state.issues.map(issue => {
      return (
        <TableRow key={issue.title}>
          <TableData>{issue.title}</TableData>
          <TableData>
            {issue.amount} {issue.denomination}
          </TableData>
          <TableData>
            <LineChart
              width={400}
              height={150}
              data={issue.data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <Line type="monotone" dataKey="tokens" stroke="#000" />
              <Line type="monotone" dataKey="conviction" stroke="#8884d8" />

              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="block" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </TableData>
          <TableData>
            <TextInput onChange={(e)=>{this.setState({votingamount:e.target.value})}}  type="number" defaultValue="0"
            />
            <button
                className="btn btn-default"
                onClick={e => {
                  this.startVote(issue, this.state.votingamount);
              }}>Vote
            </button>
            <GitCoinButton  meta={{}}
            expirydelta={60 * 60 * 24 * 30 * 3}
            value="1"
            onTxHash={hash => {
              this.setState({ txhash: hash });
            }}
          />
          </TableData>
        </TableRow>
      );
    });

    return (
    <div>
    <button
        className="btn btn-default"
        onClick={e => {
          this.mintTokens();
      }}>Mint Voting Tokens
    </button>
    <TextInput onChange={(e)=>{this.setState({githubUrl:e.target.value})}}  type="text" defaultValue=""
    />
    <button
        className="btn btn-default"
        onClick={e => {
          this.insertIssues(this.state.githubUrl);
      }}>Import GitHub Issues
    </button>
      <VotingTable>
        <thead>
          <tr>
            <th>Issue</th>
            <th>Funding</th>
            <th>Graph</th>
          </tr>
        </thead>
        <tbody>{issues}</tbody>
      </VotingTable>
     </div>
    );
  }
}
