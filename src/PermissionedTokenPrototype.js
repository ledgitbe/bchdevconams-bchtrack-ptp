import React from 'react'
import { Input, Card, List, Transfer, Popover, Button } from 'antd';
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

//OBfunction SpendComponent({ txId, blabla}) {
//  return (
//    <div>
//      )
//      };
//
//      content=<SpendComponent txId={2}  />

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
    monitoredSpends: [
      {id: 1, text: 'one'},
      {id: 2, text: 'two'},
      {id: 3, text: 'three'},
      {id: 4, text: 'four'},
      {id: 5, text: 'five'},
    ],
    selectedKeys: [],
    targetKeys: [],
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
      console.log(obj);

      if(obj.data && obj.data.length > 0 && obj.data[0].out && obj.data[0].out.length > 0) {
        switch (obj.data[0].out[0].s2) {
          case '0':
            // Genesis
            this.setState({ monitoredGenesis: [...this.state.monitoredGenesis, obj.data[0]]});
            this.addLogMessage("Received genesis transaction");
            break;
          case '1':
            // Block
            this.setState({ monitoredBlocks: [...this.state.monitoredBlocks, obj.data[0]]});
            this.addLogMessage("Received block transaction");
            break;
          case '2':
            // Coinbase
            this.setState({ monitoredCoinbase: [...this.state.monitoredCoinbase, obj.data[0]]});
            this.addLogMessage("Received coinbase transaction");
            break;
          case '3':
            // Spend
            this.setState({ monitoredSpends: [...this.state.monitoredSpends, obj.data[0]]});
            this.addLogMessage("Received spend transaction");
            break;
          default:
            this.addLogMessage("Unknown transaction type detected");
            break;
        }

        //
        console.log("Received block " + Buffer.from(obj.data[0].out[0].h4, 'hex') + " with id " + obj.data[0].tx.h);
        try {
          console.log('Coinbase transaction: ' + Buffer.from(obj.data[0].out[0].h6,'hex').toString());
        } catch (e) {
          console.log('No coinbase transaction');
        }
        //
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
    this.startMonitoring();
    try {
      ptp.createGenesis(this.state.tokenId, this.state.toAddress, this.state.ticker, this.state.name, this.state.coinbaseAddress, this.state.initialSupply, this.state.toEcPair)
    } catch (e) {
      console.log(e);
    }
    return true;
  }


  handleTransferSelectChange(sourceSelectedKeys, targetSelectedKeys) {
    this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] });
  }

  handleTransferChange(nextTargetKeys, direction, moveKeys) {
    this.setState({ targetKeys: nextTargetKeys });

    console.log('targetKeys: ', nextTargetKeys);
    console.log('direction: ', direction);
    console.log('moveKeys: ', moveKeys);
  }

  renderValidation() {
    return (
      <Card title="Validation">
        <Transfer
          titles={['Unvalidated', 'Validated']}
          targetKeys={this.state.targetKeys}
          selectedKeys={this.state.selectedKeys}
          dataSource={this.state.monitoredSpends}
          rowKey={record => record.id}
          render={item => item.text}
          onSelectChange={this.handleTransferSelectChange.bind(this)}unvalidatedSpendsKeys
          onChange={this.handleTransferChange.bind(this)}
        />
      </Card>
    );
  }

  renderSpend() {
    function SpendPopover(props) {
      return (<div>{props.txid}</div>);
    }

    var transactions = this.state.monitoredCoinbase.concat(this.state.monitoredSpends);
    return (
      <Card title="Wallet">
        <List
          size="small"
          bordered
          dataSource={transactions.filter(item => { return item.out && item.out.length>1 && item.out[0].s4 && item.out[1].e && item.out[1].e.a && this.normalizeAddress(item.out[1].e.a) === this.normalizeAddress(this.state.coinbaseAddress)})}
          renderItem={item => (
            <List.Item>
              {item.out[0].s4} {this.state.ticker} received 
              <Popover content={SpendPopover({txid:item.tx.h})} title="Spend Output" trigger="click">
                  <Button>Spend this output</Button>
              </Popover>
            </List.Item>)}
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
