// https://tronweb.network/docu/docs/API%20List/transactionBuilder/deployConstantContract

require('dotenv').config();
const { TronWeb } = require('tronweb');

// 1) Configure your TronWeb instance
const fullNode     = process.env.FULL_NODE_NILE;
const solidityNode = process.env.FULL_NODE_NILE;
const eventServer  = process.env.FULL_NODE_NILE;
const privateKey   = process.env.PRIVATE_KEY_NILE;
const tronWeb      = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

async function estimateDeployEnergy(bytecodeHex) {
  // 2) Simulate the deployment
  const ownerHex = tronWeb.address.toHex(tronWeb.defaultAddress.base58);
  const { energy_required } = await tronWeb.transactionBuilder.deployConstantContract({
    ownerAddress: ownerHex,
    input:         bytecodeHex,
    callValue:     0,
    tokenId:       0,
    tokenValue:    0,
    confirmed:     false
  });

  console.log('▶ Estimated energy:', energy_required);

  // 3) Fetch chain parameters and extract the “getEnergyFee” value
  const params = await tronWeb.trx.getChainParameters();  
  // This returns an array of { key, value } objects :contentReference[oaicite:0]{index=0}
  const energyParam = params.find(p => p.key === 'getEnergyFee');
  if (!energyParam) throw new Error('getEnergyFee not found in chain parameters');

  // The value is in SUN per unit of energy
  const energyPrice = Number(energyParam.value);
  console.log('▶ Current energy price (SUN/unit):', energyPrice);

  // 4) Compute your feeLimit
  const feeLimit = energy_required * energyPrice;
  console.log('▶ Recommended feeLimit (SUN):', feeLimit);

  return { energy_required, energyPrice, feeLimit };
}

(async () => {
  const artifact           = require('./build/contracts/MyToken.json');
  const myContractBytecode = artifact.bytecode; // already 0x-prefixed

  await estimateDeployEnergy(myContractBytecode);
})();
