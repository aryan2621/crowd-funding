# crowd-funding

Web3 crowdfunding app: back campaigns with ETH on Sepolia. Creators are paid
only if the goal is reached; otherwise backers can claim refunds.

## Layout

- `client`: Next.js frontend, statically exported to GitHub Pages
- `web3`: Solidity contract (Hardhat, deployed with thirdweb)

Live: https://aryan2621.github.io/crowd-funding/

## Develop

```bash
cd client
NEXT_PUBLIC_CLIENT_ID=<thirdweb client id> \
NEXT_PUBLIC_CONTRACT_ADDRESS=<contract address> \
npm run dev
```

Pushes to `main` that touch `client/` deploy via `.github/workflows/deploy-pages.yml`,
which reads the same two values from the repo's Actions variables.
