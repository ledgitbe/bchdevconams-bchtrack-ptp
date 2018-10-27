const BITBOXSDK = require('bitbox-sdk/lib/bitbox-sdk').default;
const BITBOX = new BITBOXSDK();

const test = true;
var prefix = Buffer.from([0x53, 0x44, 0x50, 0x00]);
if (test)
  prefix = Buffer.from([0x44, 0xDE, 0xBC, 0x0A]);

const transactionTypes= {genesis: '0', block: '1', coinbase: '2', spend: '3'};

const ptp = function () {};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const checkInputUtxos = async (inputUtxos) => {
  if (!inputUtxos || inputUtxos.length < 1) {
    throw Error('inputUtxos must contain at least 1 input');
  } else {
    return true;
  }

};


ptp.prototype.createGenesis = async (tokenId, toAddress, ticker, name, coinbaseAddress, initialSupply, toEcPair) => {
    let coinbaseUtxo = null;
  let blockUtxo = null;

  let retries = 0;
  while (!(coinbaseUtxo && blockUtxo) && retries < 5) {
    console.log('awaiting incoming payment');
    await sleep(1000);
    let allUtxo = await BITBOX.Address.utxo(toAddress);
    coinbaseUtxo = allUtxo.find(output => output.vout == 0);
    blockUtxo = allUtxo.find(output => output.vout == 1);
    retries++;
  }

  if(!(coinbaseUtxo && blockUtxo)) {
    throw new Error('Error querying the blockchain');
  }
  
  // use output from inputTx to create coinbase tx
  let coinbaseTxId = await ptp.prototype.createTransaction(tokenId, [coinbaseUtxo], true, [coinbaseAddress], [initialSupply], toEcPair);
  // use output 2 from inputTx to create genesis tx
  // attach coinbaseTx as coinbase
  return await ptp.prototype.createBlock(tokenId, [blockUtxo], toAddress, 0, coinbaseTxId, [], toEcPair, true);
};
// inputUtxo = spends this utxo
// isCoinbase = boolean indicating coinbase tx
// outputAddresses = array with output addresses
// amounts = array with output amounts (corresponding to outputAddresses)
ptp.prototype.createTransaction = async (tokenId, inputUtxos, isCoinbase, outputAddresses, amounts, ecPair) => {

  let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');

  checkInputUtxos(inputUtxos);

  let satoshis = 0;
  for (let i = 0; i < inputUtxos.length; i += 1) {
    satoshis += inputUtxos[i].satoshis;
    transactionBuilder.addInput(inputUtxos[i].txid, inputUtxos[i].vout);
  }

  let scriptArray = [BITBOX.Script.opcodes.OP_RETURN, prefix];

  if (isCoinbase) {
    scriptArray.push(Buffer.from(transactionTypes['coinbase']));
  } else {
    scriptArray.push(Buffer.from(transactionTypes['spend']));
  }
  
  scriptArray.push(Buffer.from(tokenId.toString()));

  if (outputAddresses.length < 1) {
    throw Error('outputAddresses must contain at least 1 address');
  }
  if (outputAddresses.length != amounts.length) {
    throw Error('outputAddresses must match amounts');
  }

  for (var i = 0; i < outputAddresses.length; i++) {
    scriptArray.push(Buffer.from(amounts[i].toString()));
  }

  // create array w/ OP_RETURN code and text buffer and encode
  const data = BITBOX.Script.encode(scriptArray);
  transactionBuilder.addOutput(data, 0);

  const byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: inputUtxos.length }, { P2PKH: outputAddresses.length }) + data.byteLength + 9;
  const outputAmount = satoshis - byteCount;
  for (var i = 0; i < outputAddresses.length; i++) {
    transactionBuilder.addOutput(outputAddresses[i], Math.floor(outputAmount / outputAddresses.length));
  }

  let redeemScript;
  transactionBuilder.sign(
    0
    , ecPair
    , redeemScript
    , transactionBuilder.hashTypes.SIGHASH_ALL
    , satoshis,
  );

  const hex = transactionBuilder.build().toHex();
  return await BITBOX.RawTransactions.sendRawTransaction(hex);
};

ptp.prototype.createBlock = async (tokenId, inputUtxos, outputAddress, height, coinbaseTxId, transactionIds, ecPair, isGenesis = false) => {
  let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');

  checkInputUtxos(inputUtxos);
  let satoshis = 0;
  
  for (let i = 0; i < inputUtxos.length; i += 1) {
    satoshis += inputUtxos[i].satoshis;
    transactionBuilder.addInput(inputUtxos[i].txid, inputUtxos[i].vout);
  }
  let scriptArray = [BITBOX.Script.opcodes.OP_RETURN, prefix];
  if(isGenesis) {
    scriptArray.push(Buffer.from(transactionTypes["genesis"]));
  } else {
    scriptArray.push(Buffer.from(transactionTypes["block"]));
  }
  scriptArray.push(Buffer.from(tokenId.toString()));
  scriptArray.push(Buffer.from(height.toString()));
  scriptArray.push(Buffer.from(coinbaseTxId.toString()));

  // add transaction ids
  transactionIds.forEach(id => {scriptArray.push(Buffer.from(id));});


  // create array w/ OP_RETURN code and text buffer and encode
  const data = BITBOX.Script.encode(scriptArray);
  transactionBuilder.addOutput(data, 0);


  const byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: inputUtxos.length }, { P2PKH: 1 }) + data.byteLength + 9;

  transactionBuilder.addOutput(outputAddress, satoshis - byteCount);
  let redeemScript;
  transactionBuilder.sign(
    0
    , ecPair
    , redeemScript
    , transactionBuilder.hashTypes.SIGHASH_ALL
    , satoshis,
  );


  const hex = transactionBuilder.build().toHex();
  return await BITBOX.RawTransactions.sendRawTransaction(hex);


};

export default ptp;
