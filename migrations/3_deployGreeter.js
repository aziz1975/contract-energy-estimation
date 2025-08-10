// migrations/3_deployGreeter.js
// TronBox migration: deploy Greeter(string)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Greeter = artifacts.require('Greeter');

module.exports = async function (deployer, network /*, accounts */) {
  const greeting = process.env.GREETER_TEXT || 'Hello from TRON';
  console.log(`▶ [${network}] Deploying Greeter with greeting: "${greeting}"`);

  // feeLimit is optional; include if you want to override default
  await deployer.deploy(Greeter, greeting, { feeLimit: 100_000_000 });

  const instance = await Greeter.deployed();

  // TronBox usually exposes base58 address at .address
  console.log('✅ Greeter deployed at (base58):', instance.address);

  // Some versions also expose hex:
  if (instance.addressHex || instance.address_hex) {
    console.log('   (hex):', instance.addressHex || instance.address_hex);
  }
};
