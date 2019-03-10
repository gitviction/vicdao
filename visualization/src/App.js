import React from 'react';
import {
  AppView,
  AragonApp,
  Button,
  Info,
  // Main,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  TextInput,
  // observe
} from "@aragon/ui";
import axios from "axios";
import styled from "styled-components";
import GitterCritter from "./GitterCrittter";
import {
  LineChart,
  Line,
  CartesianGrid,
  // Legend,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const AppContainer = styled(AragonApp)`
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

// const App = () => (
//   <Main>
//     <h1>Hello Aragon UI!</h1>
//   </Main>
// )

export default class App extends React.Component {
  constructor(props) {
    super();
    this.state = {
      issues: []
    };
  }

  componentDidMount() {
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
        this.setState({ issues: issues }, () => {});
      })
      .catch(error => {});
  }

  render() {
    const issues = this.state.issues.map(issue => {
      return (
        <TableRow key={issue.title}>
          <TableCell>
            <Text>{issue.title}</Text>
          </TableCell>
          <TableCell>
            <Text>
              {issue.amount} {issue.denomination}
            </Text>
          </TableCell>
          <TableCell>
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
          </TableCell>
          <TableCell>
            <TextInput type="number" defaultValue="0" />
            <Button
              mode="outline"
              onClick={e => {
                this.startVote(issue.url);
              }}
            >
              Vote
            </Button>
            {/* <GitterCritter issue={issue} app={this.props.app} /> */}
          </TableCell>
        </TableRow>
      );
    });

    return (
      <AppContainer>
        <AppView title="GitViction">
          <Info background="#FFF9EB">
            This App uses "conviction voting" to let members of the DAO vote on
            prioritization and funding of GitHub issues. The novelty in the
            voting scheme is a time component, where the token vote builds
            "conviction" over time that gets added to a total token weight. Once
            this total token weight reaches a treshold, a function is triggered
            to create a bounty on GitCoin that is funded for the amount
            requested in the issue.
          </Info>
          <Table>
            <TableRow>
              <TableHeader title="Issue" />
              <TableHeader title="Funding" />
              <TableHeader title="Voting Graph" />
              <TableHeader title="Action" />
            </TableRow>
            {issues}
          </Table>

          <hr />

          <Button
            mode="outline"
            onClick={e => {
              this.getVote();
            }}
          >
            get Vote
          </Button>

          <Button
            mode="outline"
            onClick={e => {
              this.mintForMe();
            }}
          >
            mint Voting tokens
          </Button>
        </AppView>
      </AppContainer>
    );
  }
}

