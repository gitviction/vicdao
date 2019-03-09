import React from "react";
import { AragonApp, Button, Text, observe } from "@aragon/ui";
import Aragon, { providers } from "@aragon/client";
import styled from "styled-components";
import axios from "axios";

const AppContainer = styled(AragonApp)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default class App extends React.Component {
  constructor(props) {
    super();
    this.state = {
      issues: ["one"]
    };
  }

  componentDidMount() {
    axios
      .get(
        `https://api.github.com/repos/gitviction/vicdao/issues`
      )
      .then(res => {

        this.setState({ issues: res.data }, () => {
          
        });
      })
      .catch(error => {
       
      });
  }

  render() {
    const issues = this.state.issues.map(issue => {
      return (
        <tr>
          <td>{issue.title}</td>
        </tr>
      );
    });

    return (
      <AppContainer>
        <div>
          <h1>Listt of issues you can vote on</h1>
          <table>
            <thead>
              <tr>
                <th>issue</th>
              </tr>
            </thead>
            {issues}
          </table>

          <ObservedCount observable={this.props.observable} />
          <Button onClick={() => this.props.app.decrement(1)}>DECC</Button>
          <Button onClick={() => this.props.app.increment(1)}>Increment</Button>
        </div>
      </AppContainer>
    );
  }
}

const ObservedCount = observe(state$ => state$, { count: 0 })(({ count }) => (
  <Text.Block style={{ textAlign: "center" }} size="xxlarge">
    {count}
  </Text.Block>
));
