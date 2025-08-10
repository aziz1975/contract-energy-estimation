# Contract Energy Estimation on TRON

This repository shows how to **estimate TRON energy usage before deploying** smart contracts on-chain. It includes three patterns:

- **Standard logic contract** (`MyToken.sol`)
- **Proxy + implementation (upgradeable) deployment** (`Proxy.sol` + `MyToken.sol`)
- **Constructor parameter contract** (`Greeter.sol`)

All estimates are done **off-chain** via `deployConstantContract` in TronWeb so you can size the fee limit and costs before broadcasting a real transaction.

---

## ⚙️ Setup

### Requirements
- Node.js ≥ 20 (Node 20 recommended)
- `npm install`

### Install
```bash
npm install
```

### .env
Create a `.env` in the project root:
```env
# Nile Testnet
FULL_NODE_NILE=https://nile.trongrid.io
PRIVATE_KEY_NILE=YOUR_PRIVATE_KEY

# For proxy estimation (Base58 TRON address of logic implementation)
LOGIC_IMPL_ADDRESS=TXdVFkKq1pUpQ9FcuWebux7E2BEjLgUXeo

# For Greeter estimation (optional)
GREETER_TEXT=Hello from TRON
```

> Tip: Don’t commit `.env`.

---

## 📁 Project Structure

```
contract-energy-estimation/
├─ contracts/
│  ├─ Greeter.sol           # Simple contract with constructor(string)
│  ├─ MyToken.sol           # ERC20Upgradeable logic (initializer)
│  └─ Proxy.sol             # Minimal proxy with (impl, initData) constructor
│
├─ migrations/
│  ├─ 1_deploy_logic.js     # Deploys MyToken (logic)
│  ├─ 2_deploy_proxy.js     # Deploys Proxy with initData for MyToken
│  └─ 3_deployGreeter.js    # Deploys Greeter (optional)
│
├─ build/contracts/         # TronBox artifacts (created after compile)
│   ...
├─ estimateDeployEnergy.js  # Estimate energy for MyToken (no ctor args)
├─ estimateProxyEnergy.js   # Estimate energy for Proxy + initData
├─ estimateGreeterEnergy.js # Estimate energy for Greeter (ctor string)
├─ tronbox.js               # Networks + compiler config
├─ package.json
├─ .env
└─ README.md
```

---

## 🔨 Compile Artifacts

Compile once to generate `./build/contracts/*.json`:
```bash
npx tronbox compile
```

---

## ⚡ Energy Estimation (Off-Chain)

> All scripts below **simulate** deployment using `deployConstantContract` and then compute a recommended `feeLimit` via the chain parameter `getEnergyFee`.

### 1) Standard Contract (MyToken)
Uses `artifact.bytecode` for `MyToken` (no constructor args).
```bash
node estimateDeployEnergy.js
```
Expected output:
```
▶ Estimated energy: <number>
▶ Current energy price (SUN/unit): <number>
▶ Recommended feeLimit (SUN): <number>
```

### 2) Proxy + Implementation
Encodes `Proxy` constructor `(address impl, bytes initData)` where `initData` is `initialize(name, symbol, initialSupply)` for `MyToken`.
```bash
node estimateProxyEnergy.js
```
Requires `LOGIC_IMPL_ADDRESS` in `.env` (Base58). The script converts it properly for ABI encoding.

### 3) Constructor Parameter Contract (Greeter)
Encodes `Greeter(string greeting)` and appends it to the bytecode.
```bash
node estimateGreeterEnergy.js
```
Optionally set `GREETER_TEXT` in `.env`.

---

## 🚀 Deployment (Optional)

This project’s focus is estimation, but migrations are included if you want to deploy.

### Deploy All Migrations (Nile)
```bash
npx tronbox migrate --network nile
# or:
npx tronbox deploy --network nile
```

### Deploy Only Greeter (Migration #3)
```bash
npx tronbox migrate --f 3 --to 3 --network nile
```

**Migrations included**
- `1_deploy_logic.js`: Deploys `MyToken` logic (initializer-based)
- `2_deploy_proxy.js`: Deploys `Proxy` and passes `initData` for `MyToken.initialize(...)`
- `3_deployGreeter.js`: Deploys `Greeter` with `GREETER_TEXT`

---

## 🧠 How Estimation Works

Each estimator builds the **creation payload**:
- For contracts **without constructor args**: `input = bytecode`
- For contracts **with args**: `input = bytecode + abi.encodeParameters(...).slice(2)`

Then it calls:
```js
const { energy_required } = await tronWeb.transactionBuilder.deployConstantContract({
  ownerAddress, input, callValue: 0, tokenId: 0, tokenValue: 0, confirmed: false
});
```

To price it:
1. Read chain params:
   ```js
   const params = await tronWeb.trx.getChainParameters();
   const fee = params.find(p => p.key === 'getEnergyFee').value; // SUN per energy unit
   ```
2. Compute a **recommended fee limit** (in SUN):
   ```js
   feeLimit = energy_required * fee;
   ```

> Notes:
> - If your account has **staked Energy**, the **actual TRX burned** can be lower, but `feeLimit` must still be high enough to cover worst-case.
> - Bandwidth is separate; deployment cost is dominated by Energy usage for contract creation.

---

## 🧩 Contract Notes

### `MyToken.sol`
- Upgradeable ERC20 using OpenZeppelin `ERC20Upgradeable` + `Initializable`.
- `initialize(name, symbol, initialSupply)` configures the token and mints supply.
- No constructor—intended to be called via Proxy.

### `Proxy.sol`
- Stores `implementation` and forwards calls via `fallback`.
- `constructor(address _impl, bytes _initData)` sets impl and executes optional `delegatecall(_initData)` for initialization.

### `Greeter.sol`
- Minimal example with `constructor(string _greeting)` and `setGreeting`.
- Emits `GreetingChanged` on changes.

---

## 🧯 Troubleshooting

- **`Cannot find module './build/contracts/Greeter.json'`**  
  Run `npx tronbox compile`. Ensure you’re running estimators from the project root and that artifact names match contract names.

- **Migration error: “invalid or does not take any parameters”**  
  Ensure migration files export a function:  
  `module.exports = async function (deployer, network, accounts) { ... }`

- **Invalid `LOGIC_IMPL_ADDRESS`**  
  Provide a **Base58 TRON address** (e.g., `T...`). The proxy estimator converts this to the proper 20-byte EVM-format for ABI encoding.

- **Low `feeLimit` / out-of-energy**  
  Increase `feeLimit` (in SUN). `tronbox.js` also has a `fee_limit` you can adjust per network.

---

## 🧪 Quick Commands

| Task                        | Command                                         |
|----------------------------|--------------------------------------------------|
| Compile                    | `npx tronbox compile`                            |
| Estimate MyToken           | `node estimateDeployEnergy.js`                   |
| Estimate Proxy             | `node estimateProxyEnergy.js`                    |
| Estimate Greeter           | `node estimateGreeterEnergy.js`                  |
| Deploy (all)               | `npx tronbox migrate --network nile`             |
| Deploy only Greeter (#3)   | `npx tronbox migrate --f 3 --to 3 --network nile`|

---

## 🔗 References
- [TronWeb `deployConstantContract` API](https://tronweb.network/docu/docs/API%20List/transactionBuilder/deployConstantContract)
- [TRON Developer Hub](https://developers.tron.network/)
- [OpenZeppelin Contracts Upgradeable](https://docs.openzeppelin.com/contracts/5.x/upgradeable)

---

## 📝 License
MIT
