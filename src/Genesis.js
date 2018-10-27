import React from 'react'
import { Input } from 'antd';

class Genesis extends React.Component {
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
