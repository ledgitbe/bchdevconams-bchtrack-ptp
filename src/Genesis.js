import React from 'react'
import { Input } from 'antd';

class Generis extends React.Component {
  state = {
    tokenId: null,
    ticker: null,
    name: null,
    coinbaseAddr: null,
    initialSupply: null,
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
    <div>
      <Input onChange={this.handleChange.bind(this)}  name="tokenId" />
      <Input onChange={this.handleChange.bind(this)}  name="ticker" />
      <Input onChange={this.handleChange.bind(this)}  name="name" />
      <Input onChange={this.handleChange.bind(this)}  name="coinbaseAddr" />
      <Input onChange={this.handleChange.bind(this)}  name="initialSupply" />
    </div>
  }


}
