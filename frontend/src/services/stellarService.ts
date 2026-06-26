import freighter from "@stellar/freighter-api";
import * as StellarSdk from "stellar-sdk";

// --- Custom Error Types (For Robust Error Handling) ---
export class WalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletError";
  }
}

export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransactionError";
  }
}

export class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractError";
  }
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const RPC_URL = "https://soroban-testnet.stellar.org"; 
const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// Helper to ensure we have a string address
const getAddressString = (val: any): string => {
  if (typeof val === 'string') return val;
  if (val && val.address) return val.address;
  if (val && typeof val.toString === 'function') return val.toString();
  return "";
};

/**
 * Connects to the Freighter wallet.
 */
export const connectWallet = async (): Promise<string> => {
  try {
    if (!await freighter.isConnected()) {
      throw new WalletError("Freighter wallet not found. Please install the Freighter extension.");
    }
    const res = await freighter.requestAccess();
    const address = getAddressString(res);
    if (address) return address;
    throw new WalletError("User denied wallet access or no account was found.");
  } catch (error: any) {
    if (error instanceof WalletError) throw error;
    throw new WalletError(error.message || "Failed to connect to Freighter wallet.");
  }
};

/**
 * Fetches the native XLM balance for a public address from Testnet.
 */
export const getXLMBalance = async (publicKey: string): Promise<string> => {
  try {
    const address = getAddressString(publicKey);
    if (!address) return "0";
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find((b: any) => b.asset_type === "native");
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
};

/**
 * Invokes a function on a Soroban smart contract.
 */
export const invokeContract = async (
  contractId: string,
  functionName: string,
  args: StellarSdk.xdr.ScVal[] = []
): Promise<{ hash: string }> => {
  // --- SIMULATION MODE ---
  // If the contract ID is a dummy or blank, mock a successful response.
  if (!contractId || contractId.includes("PLACEHOLDER") || contractId === "") {
    console.log(`[SIMULATION] Mocking success for contract function: ${functionName}`);
    // Simulate mining delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { hash: "sim_" + Math.random().toString(36).substring(7) + "_" + Date.now() };
  }

  try {
    const res = await freighter.requestAccess();
    const publicKey = getAddressString(res);
    if (!publicKey) throw new WalletError("Wallet not connected.");
    
    const account = await server.loadAccount(publicKey);
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.invokeHostFunction({
          func: StellarSdk.xdr.HostFunction.hostFunctionTypeInvokeContract(
            new StellarSdk.xdr.InvokeContractArgs({
              contractAddress: StellarSdk.Address.fromString(contractId).toScAddress(),
              functionName: functionName,
              args: args,
            })
          ),
          auth: [],
        })
      )
      .setTimeout(30)
      .build();

    const result = await freighter.signTransaction(transaction.toXDR(), {
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    const signedXdr = typeof result === "string" ? result : (result as any).signedTxXdr;
    if (!signedXdr) throw new TransactionError("Transaction signing failed or was rejected.");

    const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
    const response = await server.submitTransaction(tx);
    return { hash: response.hash };
  } catch (error: any) {
    if (error instanceof WalletError || error instanceof TransactionError) throw error;
    throw new ContractError(error.message || `Failed to invoke ${functionName} on-chain.`);
  }
};

/**
 * Initializes the contract (Admin only).
 */
export const initializeContract = async (contractId: string, adminAddress: string) => {
  const args = [
    StellarSdk.Address.fromString(adminAddress).toScVal()
  ];
  return await invokeContract(contractId, "initialize", args);
};

/**
 * Applies for a scholarship (Registers a candidate).
 */
export const applyScholarship = async (
  contractId: string,
  studentAddress: string,
  name: string,
  major: string,
  description: string,
  requestedAmount: number
) => {
  const args = [
    StellarSdk.Address.fromString(studentAddress).toScVal(),
    StellarSdk.nativeToScVal(name, { type: "string" }),
    StellarSdk.nativeToScVal(major, { type: "string" }),
    StellarSdk.nativeToScVal(description, { type: "string" }),
    StellarSdk.nativeToScVal(requestedAmount, { type: "u32" }),
  ];
  return await invokeContract(contractId, "apply_scholarship", args);
};

/**
 * Approves a candidate application (Admin only).
 */
export const approveCandidate = async (contractId: string, candidateId: number) => {
  const args = [
    StellarSdk.nativeToScVal(candidateId, { type: "u32" }),
  ];
  return await invokeContract(contractId, "approve_candidate", args);
};

/**
 * Casts a vote for a candidate.
 */
export const voteForCandidate = async (contractId: string, voterAddress: string, candidateId: number) => {
  const args = [
    StellarSdk.Address.fromString(voterAddress).toScVal(),
    StellarSdk.nativeToScVal(candidateId, { type: "u32" }),
  ];
  return await invokeContract(contractId, "vote", args);
};

/**
 * Closes the voting period (Admin only).
 */
export const endVoting = async (contractId: string) => {
  return await invokeContract(contractId, "end_voting", []);
};

export { server };
