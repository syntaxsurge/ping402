export function buildPing402SignInMessage(input: {
  domain: string;
  uri: string;
  publicKey: string;
  handle: string;
  nonce: string;
  issuedAt: string;
  chainId: string;
}) {
  return [
    "ping402 wants you to sign in with your Solana account:",
    input.publicKey,
    "",
    `Handle: @${input.handle}`,
    `URI: ${input.uri}`,
    `Domain: ${input.domain}`,
    `Chain ID: ${input.chainId}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt}`,
  ].join("\n");
}
