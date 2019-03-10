import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import styled from "styled-components";
import {
  LineChart,
  Line,
  CartesianGrid,
  // Legend,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const VotingTable = styled.table``;

const TableRow = styled.tr``;

const TableData = styled.td`
  padding: 2rem;
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
        <tbody>
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
          </TableRow>
        </tbody>
      );
    });

    return (
      <VotingTable>
        <thead>
          <tr>
            <th>Issue</th>
            <th>Funding</th>
            <th>Graph</th>
          </tr>
        </thead>
        {issues};
      </VotingTable>
    );
  }
}
