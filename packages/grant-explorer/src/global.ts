import { IPFS } from "ipfs-core-types";
import { PublicClient, WalletClient } from "viem";

export interface Global {
  web3Provider: PublicClient | undefined;
  web3Signer: WalletClient | undefined;
  ipfs: IPFS | undefined;
}

export const global: Global = {
  web3Provider: undefined,
  web3Signer: undefined,
  ipfs: undefined,
};
