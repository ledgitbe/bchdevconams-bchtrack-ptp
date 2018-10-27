import React from 'react'
import { Input, Card, List } from 'antd';
import {default as BITBOXSDK} from 'bitbox-sdk/lib/bitbox-sdk';
import MoneyButton from '@moneybutton/react-money-button'
import BitSocket from './BitSocket';

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
    logs: [],
  }
  monitorSocket = null;

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


    //Remove this later, this needs to be on callback from genesis moneybutton
    this.startMonitoring();
  }

  componentWillUnmount() {
    this.stopMonitoring();
  }

  handleChange(e) {
    this.setState({ [e.target.name] : e.target.value});
    console.log("Genesis State", this.state);
  }

  startMonitoring() {
    let query = {
      "v": 3,
      "q": {
        "find": { "out.h1": "44debc0a" }
      },

      "r": { "f": "." }
    };

    this.monitorSocket = BitSocket(query);


    this.monitorSocket.onmessage = (e) => {
      var obj = JSON.parse(e.data);

      if(obj.data && obj.data.length > 0 && obj.data[0].out && obj.data[0].out.length > 0) {
        console.log("Received block " + Buffer.from(obj.data[0].out[0].h4, 'hex') + " with id " + obj.data[0].tx.h);
        try {
          console.log('Coinbase transaction: ' + Buffer.from(obj.data[0].out[0].h6,'hex').toString());
        } catch (e) {
          console.log('No coinbase transaction');
        }
      }

      console.log(e);
      this.setState({ logs: [...this.state.logs, e.data]});
    };
  }

  stopMonitoring() {
    if (this.monitorSocket) {
      this.monitorSocket.close();
    }
  }

  renderGenesis() {
    return (
      <Card title="Genesis">
        <Input onChange={this.handleChange.bind(this)} name="tokenId"       placeholder="tokenId" />
        <Input onChange={this.handleChange.bind(this)} name="ticker"        placeholder="ticker" />
        <Input onChange={this.handleChange.bind(this)} name="name"          placeholder="name" />
        <Input onChange={this.handleChange.bind(this)} name="coinbaseAddr"  placeholder="coinbaseAddr" />
        <Input onChange={this.handleChange.bind(this)} name="initialSupply" placeholder="initialSupply" />
        <MoneyButton
          to={this.state.fundingAddress}
          amount="0.01"
          currency="EUR"
        />
      </Card>
    );
  }

  renderValidation() {
  }

  renderSpend() {
  }

  renderMonitor() {
    return (
      <Card title="Monitor">
        <List
          size="small"
          bordered
          dataSource={this.state.logs}
          renderItem={item => (<List.Item>{item}</List.Item>)}
        />
      </Card>
    );
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
