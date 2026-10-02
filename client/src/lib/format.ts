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
