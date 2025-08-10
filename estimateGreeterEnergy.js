
require('dotenv').config();

const Web3pkg     = require('web3');
const Web3        = Web3pkg.default || Web3pkg;
const { TronWeb } = require('tronweb');

// .env values you already use
const FULL_NODE   = process.env.FULL_NODE_NILE;
const PRIVATE_KEY = process.env.PRIVATE_KEY_NILE;

// The greeting to pass to the constructor
const GREETER_TEXT = process.env.GREETER_TEXT || "Hello from TRON";

const web3    = new Web3(FULL_NODE);
const tronWeb = new TronWeb(FULL_NODE, FULL_NODE, FULL_NODE, PRIVATE_KEY);

async function estimateGreeterEnergy() {
  // 1) Load compiled artifact (bytecode must be 0x-prefixed)
  const { bytecode } = require('./build/contracts/Greeter.json');
  if (!bytecode || !bytecode.startsWith('0x')) {
    throw new Error('Greeter artifact bytecode missing or not 0x-prefixed');
  }

  // 2) ABI-encode the constructor parameter (string)
  const ctorData = web3.eth.abi.encodeParameters(['string'], [GREETER_TEXT]).slice(2);

  // 3) Build the full creation input (bytecode + constructor args)
  const input = bytecode + ctorData;

  // 4) Simulate via deployConstantContract
  const ownerHex = tronWeb.address.toHex(tronWeb.defaultAddress.base58);
  const { energy_required } = await tronWeb.transactionBuilder.deployConstantContract({
    ownerAddress: ownerHex,
    input,
    callValue:   0,
    tokenId:     0,
    tokenValue:  0,
    confirmed:   false
  });

  console.log('▶ Estimated energy:', energy_required);

  // 5) Pull current energy price (SUN per unit)
  const params      = await tronWeb.trx.getChainParameters();
  const energyParam = params.find(p => p.key === 'getEnergyFee');
  if (!energyParam) throw new Error('getEnergyFee not found in chain parameters');

  const energyPrice = Number(energyParam.value); // SUN / energy unit
  console.log('▶ Current energy price (SUN/unit):', energyPrice);

  // 6) feeLimit recommendation (in SUN)
  const feeLimit = energy_required * energyPrice;
  console.log('▶ Recommended feeLimit (SUN):', feeLimit);

  return { energy_required, energyPrice, feeLimit };
}

estimateGreeterEnergy()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error estimating Greeter energy:', err);
    process.exit(1);
  });
