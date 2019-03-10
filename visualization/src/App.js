import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import styled from "styled-components";
import { ethers } from 'ethers';
import {CONTRACTS} from './contracts';
import GitCoinButton from 'gitcoinbutton';

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

  connectMetamask() {
      console.log('web3', window.web3);
      this.provider = new ethers.providers.Web3Provider(window.web3.currentProvider);
      this.signer = this.provider.getSigner();
      this.victionT = new ethers.Contract(CONTRACTS.victiont.address['3'], CONTRACTS.victiont.abi, this.signer);
      this.viction = new ethers.Contract(CONTRACTS.viction.address['3'], CONTRACTS.viction.abi, this.signer);
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
    console.log('url', url);
    // url = `https://api.${url.substring(8)}`;
    axios
      .get(`https://api.github.com/repos/gitviction/vicdao/issues`)
      .then(res => {
        // debugger;
        let issues = res.data
          .map(issue => {
            // parse issue body
            const voteData = issue.body.split(" ");
            let a = 0;
            let d = "DAI";
            if (voteData.length === 3 && voteData[0] === "voteonfunding") {
              a = parseInt(voteData[1]);
              d = voteData[2];
            }

            return {
              ...issue,
              amount: a,
              denomination: d
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
      console.log('getAllProposals', this.viction, this.viction.interface.events)
      // let filter = this.viction.ProposalAdded(null);
      // console.log(filter)
      //   on('ProposalAdded', async (id) => {
      //     console.log('ProposalAdded', id);
      // });

      const ProposalAddedEvent = this.viction.interface.events.ProposalAdded;

    const logs = await this.provider.getLogs({
        fromBlock: 0,
        toBlock: "latest",
        address: this.viction.address,
        topics: ProposalAddedEvent.topics
    });
    let issues = [];
    for (const log of logs)
    {
        console.log(log)
        if (log.topics.indexOf(ProposalAddedEvent.topic) > -1) {
            const logData = parseInt(ethers.utils.hexStripZeros(log.data), 16) // ProposalAddedEvent.parse(log.topics, log.data);

            console.log(logData);

            let chainissue = await this.viction.getProposal(logData);
            console.log('chainissue', chainissue);
            this.state.issues = this.state.issues.map(issue => {
                if (issue.id == chainissue[1].toNumber()) {
                    issue.proposalid = logData;
                }
                return issue;
            });
        }
    }
  }

  insertProposals(issues) {
     issues.forEach(issue => {
        console.log('issue', issue, issue.amount, this.viction)
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
              data={data}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <Line type="monotone" dataKey="tokens" stroke="#000" />
              <Line type="monotone" dataKey="conviction" stroke="#8884d8" />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" />
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="name" />
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
