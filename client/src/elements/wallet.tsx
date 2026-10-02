"use client";

import React from "react";
import {
    metamaskWallet,
    useAddress,
    useConnect,
    useConnectionStatus,
    useDisconnect,
    useNetworkMismatch,
    useSwitchChain,
} from "@thirdweb-dev/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WithTooltip } from "@/elements/with-tooltip";
import { useToast } from "@/hooks/use-toast";
import { SEPOLIA_CHAIN_ID, shortAddress } from "@/lib/format";

const metamask = metamaskWallet();

export function useWallet() {
    const { toast } = useToast();
    const address = useAddress();
    const status = useConnectionStatus();
    const connect = useConnect();
    const disconnect = useDisconnect();
    const isWrongNetwork = useNetworkMismatch();
    const switchChain = useSwitchChain();

    const connectWallet = async () => {
        try {
            await connect(metamask, { chainId: SEPOLIA_CHAIN_ID });
            return true;
        } catch (error) {
            console.error("Failed to connect:", error);
            toast({
                title: "Couldn't connect wallet",
                description: "Make sure MetaMask is installed and unlocked.",
            });
            return false;
        }
    };

    // Writes must go to Sepolia; ask MetaMask to switch first if needed.
    const ensureNetwork = async () => {
        if (isWrongNetwork) await switchChain(SEPOLIA_CHAIN_ID);
    };

    return {
        address,
        isConnecting: status === "connecting",
        isWrongNetwork: !!address && isWrongNetwork,
        connectWallet,
        disconnect,
        ensureNetwork,
    };
}

export function AddressAvatar({
    address,
    className = "h-8 w-8",
}: {
    address: string;
    className?: string;
}) {
    return (
        <Avatar className={className}>
            <AvatarImage src={`https://avatar.vercel.sh/${address}`} />
            <AvatarFallback>{address.slice(2, 4)}</AvatarFallback>
        </Avatar>
    );
}

export function WalletButton() {
    const {
        address,
        isConnecting,
        isWrongNetwork,
        connectWallet,
        disconnect,
        ensureNetwork,
    } = useWallet();

    if (!address) {
        return (
            <WithTooltip label="Connect your MetaMask wallet">
                <Button onClick={connectWallet} disabled={isConnecting}>
                    {isConnecting ? "Connecting…" : "Connect wallet"}
                </Button>
            </WithTooltip>
        );
    }
    return (
        <div className="flex items-center gap-2">
            {isWrongNetwork ? (
                <WithTooltip label="This app runs on the Sepolia testnet">
                    <Button
                        variant="outline"
                        className="border-destructive/50 text-destructive"
                        onClick={ensureNetwork}
                    >
                        Switch to Sepolia
                    </Button>
                </WithTooltip>
            ) : (
                <WithTooltip label={`Connected as ${address}`}>
                    <span className="hidden sm:flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm font-medium">
                        <AddressAvatar address={address} className="h-7 w-7" />
                        {shortAddress(address)}
                    </span>
                </WithTooltip>
            )}
            <WithTooltip label="Disconnect your wallet">
                <Button variant="ghost" onClick={() => disconnect()}>
                    Disconnect
                </Button>
            </WithTooltip>
        </div>
    );
}
