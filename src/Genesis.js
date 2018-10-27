import React from 'react'
import { Input } from 'antd';
import {default as BITBOXSDK} from 'bitbox-sdk/lib/bitbox-sdk';

const BITBOX = new BITBOXSDK();

class Genesis extends React.Component {
  state = {
    tokenId: null,
    ticker: null,
    name: null,
    coinbaseAddress: null,
    initialSupply: null,
    fundingAddress: null,
    toAddress: null,
    fundingEcPair: null,
    toEcPair: null,
    mnemonic: null,
  }

  componentWillMount() {
    // generate entropy
    let entropy = BITBOX.Crypto.randomBytes(32);

    // create mnemonic from entropy
    let mnemonic = BITBOX.Mnemonic.fromEntropy(entropy);

    // set mnemonic in state
    this.setState({mnemonic});

    // create seed buffer from mnemonic
    let seedBuffer = BITBOX.Mnemonic.toSeed(mnemonic);
    // create HDNode from seed buffer
    let hdNode = BITBOX.HDNode.fromSeed(seedBuffer);

    // create child nodes for different purpusos
    let fundingHdNode = BITBOX.HDNode.deriveHardened(hdNode, 0);
    let fundingAddress = BITBOX.HDNode.toCashAddress(fundingHdNode);
    let fundingEcPair = BITBOX.HDNode.toKeyPair(fundingHdNode);

    this.setState({fundingEcPair});
    this.setState({fundingAddress});
    
    let coinbaseHdNode = BITBOX.HDNode.deriveHardened(hdNode, 1);
    let coinbaseAddress = BITBOX.HDNode.toCashAddress(coinbaseHdNode);

    this.setState({coinbaseAddress});

    let toHdNode = BITBOX.HDNode.deriveHardened(hdNode, 2);
    let toAddress = BITBOX.HDNode.toCashAddress(toHdNode);
    let toEcPair = BITBOX.HDNode.toKeyPair(toHdNode);
    
    this.setState({toEcPair});
    this.setState({toAddress});
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
    console.log(this.state);
    return (
      <div>
        <Input onChange={this.handleChange.bind(this)} name="tokenId"       placeholder="tokenId" />
        <Input onChange={this.handleChange.bind(this)} name="ticker"        placeholder="ticker" />
        <Input onChange={this.handleChange.bind(this)} name="name"          placeholder="name" />
        <Input onChange={this.handleChange.bind(this)} name="coinbaseAddr"  placeholder="coinbaseAddr" />
        <Input onChange={this.handleChange.bind(this)} name="initialSupply" placeholder="initialSupply" />
      </div>);
  }


}

export default Genesis;
