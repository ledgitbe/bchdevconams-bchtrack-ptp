import React from 'react'
import { Input, Card } from 'antd';
import {default as BITBOXSDK} from 'bitbox-sdk/lib/bitbox-sdk';
import MoneyButton from '@moneybutton/react-money-button'
import BitSocket from './BitSocket';
import ptpSdk from './ptp';

const ptp = new ptpSdk();

const BITBOX = new BITBOXSDK();
//
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

class PermissionedTokenPrototype extends React.Component {
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
    genesisTxId: null,
  }

  componentWillMount() {
    this.bitsocket = BitSocket();
    this.bitsocket.onmessage = function(e) {
      console.log(e);
    }
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

  componentWillUmount() {
    this.bitsocket.close();
  }

  handleChange(e) {
    this.setState({ [e.target.name] : e.target.value});
    console.log("Genesis State", this.state);
  }

  renderGenesis() {
    return (
      <Card title="Genesis">
        <Input onChange={this.handleChange.bind(this)} name="tokenId"       placeholder="tokenId" />
        <Input onChange={this.handleChange.bind(this)} name="ticker"        placeholder="ticker" />
        <Input onChange={this.handleChange.bind(this)} name="name"          placeholder="name" />
        <Input onChange={this.handleChange.bind(this)} name="initialSupply" placeholder="initialSupply" />
        <MoneyButton
          to={this.state.fundingAddress}
          amount="0.05"
          currency="EUR"
          onPayment={this.createGenesis.bind(this)}
        />
      </Card>
    );
  }

  async createGenesis() {
    try {
      ptp.createGenesis(this.state.tokenId, this.state.fundingAddress, this.state.toAddress, this.state.ticker, this.state.name, this.state.coinbaseAddress, this.state.initialSupply, this.state.fundingEcPair, this.state.toEcPair)
    } catch (e) {
      console.log(e);
    }
    return true;
  }

  renderValidation() {
  }

  renderSpend() {
  }

  renderMonitor() {
  }

  render() {
    console.log(this.state);
    return (
      <div>
        { this.renderGenesis() }
        { this.renderValidation() }
        { this.renderSpend() }
        { this.renderMonitor() }
      </div>
    );
  }


}

export default PermissionedTokenPrototype;
