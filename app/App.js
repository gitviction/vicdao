import React from "react";
import {
  AppView,
  AragonApp,
  Button,
  Main,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  observe
} from "@aragon/ui";
import Aragon, { providers } from "@aragon/client";
import styled from "styled-components";
import axios from "axios";
import GitterCritter from "./GitterCrittter";

const AppContainer = styled(AragonApp)`
  align-items: center;
  justify-content: center;
`;

export default class App extends React.Component {
  constructor(props) {
    super();
    this.state = {
      issues: []
    };
  }

  startVote(issueid) {}

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
              (a = parseInt(voteData[1])), (d = voteData[2]);
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
        <TableRow>
          <TableCell>
            <Text>{issue.title}</Text>
          </TableCell>
          <TableCell>
            <Text>
              {issue.amount} {issue.denomination}
            </Text>
          </TableCell>
          <TableCell>
            <Button
              mode="outline"
              onClick={e => {
                this.startVote(issue.url);
              }}
            >
              Vote
            </Button>
            <GitterCritter issue={issue} app={this.props.app} />
          </TableCell>
        </TableRow>
      );
    });

    return (
      <AppContainer>
        <AppView title="GitViction">
          <Text color="tomato" size="xlarge">
            List of issues you can vote on
          </Text>
          <Table>
            <TableRow>
              <TableHeader title="Issue" />
              <TableHeader title="Funding" />
              <TableHeader title="Action" />
            </TableRow>
            {issues}
          </Table>

          <hr />

          {/* <ObservedCount observable={this.props.observable} />
          <Button onClick={() => this.props.app.decrement(1)}>DECC</Button>
          <Button onClick={() => this.props.app.increment(1)}>Increment</Button> */}
        </AppView>
      </AppContainer>
    );
  }
}

const ObservedCount = observe(state$ => state$, { count: 0 })(({ count }) => (
  <Text.Block style={{ textAlign: "center" }} size="xxlarge">
    {count}
  </Text.Block>
));
