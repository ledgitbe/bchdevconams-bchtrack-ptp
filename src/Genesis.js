import React from 'react'
import { Input } from 'antd';
import {default as BITBOXSDK} from 'bitbox-sdk/lib/bitbox-sdk';
import MoneyButton from '@moneybutton/react-money-button'
import BitSocket from './BitSocket';

const BITBOX = new BITBOXSDK();

class Genesis extends React.Component {
  state = {
    tokenId: null,
    ticker: null,
    name: null,
    coinbaseAddr: null,
    initialSupply: null,
    fundingAddress: null,
    toAddress: null,
    fundingEcPair: null,
    toEcPair: null,
  }

  componentWillMount() {
    this.bitsocket = BitSocket();
    a.onmessage = function(e) {
      console.log(e);
    }
  }

  componentWillUmount() {
    this.bitsocket.close();
  }

  //*  tokenid
  //*  ticker
  //*  name
  //*  coinbase address (issuance van nieuwe tokens)
  //*  initial supply
  //
  //funcing EC pair
  //funding address
  //toAddress
  //
  handleChange(e) {
    this.setState({ [e.target.name] : e.target.value});
    console.log("Genesis State", this.state);
  }

  render() {
    return (
    <div>
      <h1>Genesis</h1>
      <Input onChange={this.handleChange.bind(this)} name="tokenId"       placeholder="tokenId" />
      <Input onChange={this.handleChange.bind(this)} name="ticker"        placeholder="ticker" />
      <Input onChange={this.handleChange.bind(this)} name="name"          placeholder="name" />
      <Input onChange={this.handleChange.bind(this)} name="coinbaseAddr"  placeholder="coinbaseAddr" />
      <Input onChange={this.handleChange.bind(this)} name="initialSupply" placeholder="initialSupply" />
      <MoneyButton 
        outputs={[
          {
            type: 'script',
            script: 'OP_RETURN bla',
            amount: 0.0000001,
            currency: 'BCH'
          }
        ]}
      />
    </div>);
  }


}

export default Genesis;
