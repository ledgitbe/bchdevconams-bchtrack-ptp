import React from 'react'
import { Input, Card, List, Transfer } from 'antd';
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
    toAddress: null,
    toEcPair: null,
    mnemonic: null,
    logs: [],
    genesisTxId: null,
    monitoredGenesis: [],
    monitoredBlocks: [],
    monitoredCoinbase: [],
    monitoredSpends: [],
    unvalidatedSpendsKeys: [],
    validatedSpendsKeys: [],
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

  addLogMessage(msg) {
    this.setState({logs: [...this.state.logs, msg]});
  }

  startMonitoring() {
    let query = {
      "v": 3,
      "q": {
        "find": { "out.h1": "44debc0a", "out.s3": this.state.tokenId }
      },

      "r": { "f": "." }
    };

    this.monitorSocket = BitSocket(query);

    this.addLogMessage("Started monitoring for transactions for tokenId " + this.state.tokenId);

    this.monitorSocket.onmessage = (e) => {
      if (e.type === 'open') {
        return;
      }

      var obj = JSON.parse(e.data);

      if(obj.data && obj.data.length > 0 && obj.data[0].out && obj.data[0].out.length > 0) {
        switch (obj.data.out[0].s4) {
          case '0':
            // Genesis
            break;
          case '1':
            // Block
            break;
          case '2':
            // Coinbase
            break;
          case '3':
            // Spend
            break;
          default:
            this.addLogMessage("Unknown transaction type detected");
            break;
          }
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
        <Input onChange={this.handleChange.bind(this)} name="initialSupply" placeholder="initialSupply" />
        <MoneyButton
          outputs={[{address:this.state.toAddress,amount:0.05,currency:'EUR'},{address:this.state.toAddress,amount:0.03,currency:'EUR'}]}
          onPayment={this.createGenesis.bind(this)}
        />
      </Card>
    );
  }

  async createGenesis() {
    try {
      ptp.createGenesis(this.state.tokenId, this.state.toAddress, this.state.ticker, this.state.name, this.state.coinbaseAddress, this.state.initialSupply, this.state.toEcPair)
    } catch (e) {
      console.log(e);
    }
    return true;
  }

  renderValidation() {
    return (
      <Card title="Validation">
        <Transfer />
      </Card>
    );
  }

  renderSpend() {
    return (
      <Card title="Wallet">
        <List
          size="small"
          bordered
          dataSource={this.state.logs.filter(item => { item = JSON.parsereturn item.data && item.data.out && item.data.out.length>1 && item.data.out[1].e && item.data.out[1].e.a && this.normalizeAddress(item.data.out[1].e.a) === this.normalizeAddress(this.state.coinbaseAddress)})}
          renderItem={item => (<List.Item>{item}</List.Item>)}
        />
      </Card>
    );

  }

  normalizeAddress(address) {
    if(address.startsWith('bitcoincash:')) {
      return address.split(':')[1];
    } else {
      return address;
    }
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
