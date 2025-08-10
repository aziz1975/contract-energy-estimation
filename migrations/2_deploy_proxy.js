const Proxy   = artifacts.require("Proxy");
const MyToken = artifacts.require("MyToken");

// pull in the Web3 constructor (either default or top-level)
const Web3 = require("web3").default || require("web3");

module.exports = async function(deployer, network, accounts) {
  // create a web3 instance tied to the same provider TronBox is using
  const web3 = new Web3(deployer.provider);

  // ABI-encode initialize(name, symbol, initialSupply)
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
      "AHM TRC20 Token",                    // your token name
      "AHM",                               // your symbol
      //web3.utils.toWei("1000000", "ether") // 1 000 000 * 10^18 or hardcode 1000000000000000000000000000000
      BigInt("1000000") * (BigInt(10) ** BigInt(18))
    ]
  );

  // now deploy the proxy up-front with your logic + init data
  await deployer.deploy(
    Proxy,
    MyToken.address,
    initData,
    { value: 0 }
  );

  console.log("🛡️  Proxy deployed at:", Proxy.address);
};
