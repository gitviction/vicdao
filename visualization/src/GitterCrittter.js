import React from "react";
import axios from "axios";
import IPFS from "ipfs-mini";
import tokenAbi from "human-standard-token-abi";
import standardbounties from "./sb";
import { Button } from "@aragon/ui";
const ipfs = new IPFS();
const Web3 = require("web3");

const DAIADDRESS = "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359";
const BNADDRESS = "0x2af47a65da8CD66729b4209C22017d6A5C2d2400";

export default class GitterCritter extends React.Component {
  // constructor(props) {
  //   super();
  // }

  componentDidMount() {
    //debugger;
  }

  postIt() {
    //debugger;

    const i = this.props.issue;

    var data = {
      payload: {
        title: i.title,
        description: "description of " + i.title,
        sourceFileHash: "",
        categories: [""],
        revisions: 0,
        privateFulfillments: false,
        fulfillersNeedApproval: false,
        created: 1552076131,
        tokenAddress: DAIADDRESS,
        difficulty: "Beginner",
        issuer: {
          address: "0x5f986f4126a636005147666322c4d537be7a8dd9",
          name: "The GitCoin Critter"
        },
        funders: [
          {
            address: "0x5f986f4126a636005147666322c4d537be7a8dd9`",
            name: "The GitCoin Critter"
          }
        ],
        symbol: "DAI"
      },
      meta: {
        platform: "vic",
        schemaVersion: "0.1",
        schemaName: "gitcoinSchema"
      }
    };

    ipfs.setProvider({
      host: "ipfs.web3.party",
      port: 5001,
      protocol: "https"
    });

    ipfs.addJSON(data, (err, result) => {
      console.log(err, result);

      if (result) {
        this.mkTx(result);
      }
    });
  }

  mkTx(hash) {

    const t = this.props.app.external(BNADDRESS, standardbounties.abi)

    //   debugger;
    //   this.web3 = new Web3(this.props.app);
    // const standardbountiesInstance = new this.web3.eth.Contract(
    //   standardbounties.abi,
    //   BNADDRESS
    // );
    // debugger;
  }

  render() {
    return (
      <Button
        mode="strong"
        onClick={e => {
          this.postIt();
        }}
      >
        Post It
      </Button>
    );
  }
}
