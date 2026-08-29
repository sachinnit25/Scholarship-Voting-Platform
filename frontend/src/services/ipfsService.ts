/**
 * IPFS Service for Decentralized Metadata Pinning & Verification
 */

export interface IPFSMetadata {
  cid: string;
  name: string;
  description: string;
  fileType: string;
  sizeBytes: number;
  pinnedAt: string;
  gatewayUrl: string;
}

export const pinMetadataToIPFS = async (
  title: string,
  description: string,
  fileType: string = "application/pdf"
): Promise<IPFSMetadata> => {
  // Simulate IPFS CID generation (sha256 representation)
  const mockCid = "Qm" + Array.from({ length: 44 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 62)
    )
  ).join("");

  // Delay simulation
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    cid: mockCid,
    name: title,
    description: description,
    fileType,
    sizeBytes: Math.floor(Math.random() * 500000) + 50000,
    pinnedAt: new Date().toISOString(),
    gatewayUrl: `https://ipfs.io/ipfs/${mockCid}`,
  };
};

export const formatIPFSUrl = (cidOrUrl: string): string => {
  if (!cidOrUrl) return "";
  if (cidOrUrl.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${cidOrUrl.replace("ipfs://", "")}`;
  }
  if (cidOrUrl.startsWith("Qm") || cidOrUrl.startsWith("bafy")) {
    return `https://ipfs.io/ipfs/${cidOrUrl}`;
  }
  return cidOrUrl;
};
