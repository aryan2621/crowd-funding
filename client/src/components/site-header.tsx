"use client";

import React from "react";
import Link from "next/link";
import { Plus, Sprout } from "lucide-react";
import { IconButton, WithTooltip } from "@/elements/with-tooltip";
import { ThemeToggle } from "@/elements/theme-toggle";
import { WalletButton } from "@/elements/wallet";
import { EXPLORER_URL } from "@/lib/format";

export function SiteHeader({ onCreate }: { onCreate?: () => void }) {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
                <WithTooltip label="Home">
                    <Link
                        href="/"
                        className="flex items-center gap-2 font-semibold tracking-tight"
                    >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                            <Sprout className="h-4 w-4" />
                        </span>
                        crowdfund
                    </Link>
                </WithTooltip>
                <div className="flex items-center gap-1">
                    {onCreate && (
                        <IconButton label="Start a campaign" onClick={onCreate}>
                            <Plus />
                        </IconButton>
                    )}
                    <ThemeToggle />
                    <div className="ml-2">
                        <WalletButton />
                    </div>
                </div>
            </div>
        </header>
    );
}

export function SiteFooter() {
    const contract = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    return (
        <footer className="border-t">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
                <span>crowdfund · runs on the Ethereum Sepolia testnet</span>
                {contract && (
                    <WithTooltip label="View the smart contract on Etherscan">
                        <a
                            href={`${EXPLORER_URL}/address/${contract}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-foreground underline-offset-4 hover:underline"
                        >
                            Smart contract ↗
                        </a>
                    </WithTooltip>
                )}
            </div>
        </footer>
    );
}
