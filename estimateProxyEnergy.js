require('dotenv').config();

const Web3pkg     = require('web3');
const Web3        = Web3pkg.default || Web3pkg;
const { TronWeb } = require('tronweb');

// 1) Load your .env
const FULL_NODE     = process.env.FULL_NODE_NILE;
const PRIVATE_KEY   = process.env.PRIVATE_KEY_NILE;
const RAW_IMPL_ADDR = process.env.LOGIC_IMPL_ADDRESS;


// 2) Instantiate clients
const web3    = new Web3(FULL_NODE);
const tronWeb = new TronWeb(FULL_NODE, FULL_NODE, FULL_NODE, PRIVATE_KEY);

// 3) Convert Base58 → hex (no 0x), then strip the first byte (“41”)  
//    so you end up with 20 bytes (40 hex chars) for the EVM-style address
let rawHex = tronWeb.address.toHex(RAW_IMPL_ADDR);       // e.g. "41abcd…1234"
if (!/^[0-9a-fA-F]+$/.test(rawHex)) {
  console.error("❌ LOGIC_IMPL_ADDRESS isn’t a valid Base58 Tron address:", RAW_IMPL_ADDR);
  process.exit(1);
}

// rawHex is e.g. "41XXXXXXXX…YYYY". Drop the leading "41":
if (rawHex.length !== 42) {
  console.error("❌ Unexpected length from tronWeb.address.toHex:", rawHex);
  process.exit(1);
}
const twentyByteHex = rawHex.slice(2);                  // drop "41" → 40 hex chars
const implHex       = "0x" + twentyByteHex.toLowerCase();

// console.log("▶ Normalized impl address for Web3:", implHex);


// 4) Define your Proxy’s initialize(...) args
const INITIAL_NAME   = "AHM TRC20 Token";
const INITIAL_SYMBOL = "AHM";
const INITIAL_SUPPLY = BigInt("1000000") * (BigInt(10) ** BigInt(18)); // 1e6 × 1e18

// 5) ABI-encode initialize(name,string,uint256)
const initData = web3.eth.abi.encodeFunctionCall(
  {
    name: "initialize",
    type: "function",
    inputs: [
      { type: "string",  name: "name_"          },
      { type: "string",  name: "symbol_"        },
      { type: "uint256", name: "initialSupply_" },
    ]
  },
  [
    INITIAL_NAME,
    INITIAL_SYMBOL,
    INITIAL_SUPPLY.toString()
  ]
);

async function estimateProxyEnergy() {
  // 6) Load your Proxy bytecode
  const { bytecode } = require("./build/contracts/Proxy.json");

  // 7) ABI-encode the constructor args (address, bytes)
  const ctorData = web3.eth.abi
    .encodeParameters(
      ["address","bytes"],
      [ implHex, initData ]
    )
    .slice(2);  // strip "0x"

  // 8) Build the full “input” payload
  const input = bytecode + ctorData;

  // 9) Simulate via TronWeb
  const ownerHex = tronWeb.address.toHex(tronWeb.defaultAddress.base58);
  const { energy_required } = await tronWeb.transactionBuilder.deployConstantContract({
    ownerAddress: ownerHex,
    input,
    callValue: 0,
    tokenId: 0,
    tokenValue: 0,
    confirmed: false
  });
  console.log("▶ Estimated energy:", energy_required);

  // 10) Grab the current SUN-per-energy unit
  const params   = await tronWeb.trx.getChainParameters();
  const feeParam = params.find(p => p.key === "getEnergyFee");
  if (!feeParam) throw new Error("getEnergyFee not found");
  const energyPrice = Number(feeParam.value);
  console.log("▶ Energy price (SUN/unit):", energyPrice);

  // 11) Compute your recommended feeLimit
  const feeLimit = energy_required * energyPrice;
  console.log("▶ Recommended feeLimit (SUN):", feeLimit);

  return { energy_required, energyPrice, feeLimit };
}

estimateProxyEnergy()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("❌ Error estimating Proxy energy:", err);
    process.exit(1);
  });
