import { BigNumber, ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;
export const EXPLORER_URL = "https://sepolia.etherscan.io";

export function formatEth(value: BigNumber, decimals = 4): string {
    const [whole, fraction = ""] = ethers.utils.formatEther(value).split(".");
    const trimmed = fraction.slice(0, decimals).replace(/0+$/, "");
    return trimmed ? `${whole}.${trimmed}` : whole;
}

export function shortAddress(address: string): string {
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function timeLeft(deadline: BigNumber): string {
    const ms = deadline.toNumber() * 1000 - Date.now();
    if (ms <= 0) return "Ended";
    const hours = Math.floor(ms / 3_600_000);
    if (hours < 24) return hours <= 1 ? "Ends within an hour" : `${hours} hours left`;
    const days = Math.ceil(hours / 24);
    return days === 1 ? "1 day left" : `${days} days left`;
}

// Wallet providers (notably MetaMask in Brave) can be slow to report a
// receipt even after the transaction is mined. Resolve as soon as either
// the write resolves or the expected on-chain change shows up in our reads.
export async function settle(
    action: Promise<unknown>,
    isDone: () => boolean,
): Promise<void> {
    let timer: ReturnType<typeof setInterval> | undefined;
    const seen = new Promise<void>((resolve) => {
        timer = setInterval(() => isDone() && resolve(), 1000);
    });
    try {
        await Promise.race([action, seen]);
    } finally {
        clearInterval(timer);
    }
}
