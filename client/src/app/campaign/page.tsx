"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    useContract,
    useContractRead,
    useContractWrite,
} from "@thirdweb-dev/react";
import { BigNumber, ethers } from "ethers";
import {
    ArrowLeft,
    ExternalLink,
    Link2,
    Loader2,
    Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CampaignImage, StatusPill } from "@/components/campaign-card";
import { IconButton, WithTooltip } from "@/elements/with-tooltip";
import { AddressAvatar, useWallet } from "@/elements/wallet";
import { EXPLORER_URL, formatEth, shortAddress, timeLeft } from "@/lib/format";
import { Campaign, getCampaignStatus, getProgress } from "@/models/campaign";

// Campaign IDs only exist on-chain, so the page reads ?id= at runtime
// instead of using a dynamic route (which static export can't pre-render).
export default function Page() {
    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">
                <Suspense fallback={<Spinner />}>
                    <CampaignDetails />
                </Suspense>
            </main>
            <SiteFooter />
        </div>
    );
}

function Spinner() {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
}

function CampaignDetails() {
    const { toast } = useToast();
    const key = useSearchParams().get("id") ?? "";
    const { address, connectWallet, ensureNetwork } = useWallet();
    const { contract } = useContract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
    const { data: campaign, isLoading } = useContractRead(
        contract,
        "getCampaign",
        [key],
    ) as { data: Campaign | undefined; isLoading: boolean };
    const { data: contribution } = useContractRead(contract, "contributions", [
        key,
        address ?? ethers.constants.AddressZero,
    ]);
    const { mutateAsync: donateToCampaign, isLoading: isDonating } =
        useContractWrite(contract, "donateToCampaign");
    const { mutateAsync: claimRefund, isLoading: isRefunding } =
        useContractWrite(contract, "claimRefund");
    const { mutateAsync: closeCampaign, isLoading: isClosing } =
        useContractWrite(contract, "closeCampaign");

    const [amount, setAmount] = useState("");
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    if (isLoading || (!campaign && !contract)) return <Spinner />;
    if (!campaign)
        return (
            <div className="mx-auto max-w-md px-4 py-24 text-center">
                <h1 className="text-xl font-semibold">Campaign not found</h1>
                <p className="mt-2 text-muted-foreground">
                    It may not exist on this contract.
                </p>
                <Button asChild variant="outline" className="mt-6">
                    <Link href="/">Back to campaigns</Link>
                </Button>
            </div>
        );

    const status = getCampaignStatus(campaign);
    const progress = getProgress(campaign);
    const isOwner =
        !!address && address.toLowerCase() === campaign.owner.toLowerCase();
    const myContribution = BigNumber.from(contribution ?? 0);
    const remaining = campaign.target.sub(campaign.amountCollected);
    const backers = new Set(campaign.donators.map((d) => d.toLowerCase())).size;

    // Wraps a contract write with wallet/network checks and toasts.
    const run = async (
        action: () => Promise<unknown>,
        success: string,
        failure: string,
    ) => {
        if (!address && !(await connectWallet())) return false;
        try {
            await ensureNetwork();
            await action();
            toast({ title: success });
            return true;
        } catch (error) {
            console.error(failure, error);
            toast({
                title: failure,
                description: "The transaction was rejected or failed.",
            });
            return false;
        }
    };

    const handleDonate = async (e: React.FormEvent) => {
        e.preventDefault();
        const done = await run(
            () =>
                donateToCampaign({
                    args: [key],
                    overrides: { value: ethers.utils.parseEther(amount) },
                }),
            "Thanks for backing this campaign!",
            "Couldn't send donation",
        );
        if (done) setAmount("");
    };

    const handleClose = async () => {
        const done = await run(
            () => closeCampaign({ args: [key] }),
            status === "funded"
                ? "Funds sent to your wallet"
                : "Campaign ended. Backers can now claim refunds.",
            "Couldn't close campaign",
        );
        if (done) setIsConfirmOpen(false);
    };

    const handleRefund = () =>
        run(
            () => claimRefund({ args: [key] }),
            "Refund sent to your wallet",
            "Couldn't claim refund",
        );

    const copyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied" });
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                <IconButton label="Back to campaigns" asChild>
                    <Link href="/">
                        <ArrowLeft />
                    </Link>
                </IconButton>
                <IconButton label="Copy link to this campaign" onClick={copyLink}>
                    <Link2 />
                </IconButton>
            </div>

            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
                <article className="min-w-0">
                    <CampaignImage
                        src={campaign.image}
                        alt={campaign.title}
                        className="aspect-video w-full rounded-2xl"
                    />
                    <h1 className="mt-8 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
                        {campaign.title}
                    </h1>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <AddressAvatar address={campaign.owner} />
                        <span>
                            by{" "}
                            <span className="font-medium text-foreground">
                                {isOwner ? "you" : shortAddress(campaign.owner)}
                            </span>
                        </span>
                        <IconButton label="View creator on Etherscan" asChild>
                            <a
                                href={`${EXPLORER_URL}/address/${campaign.owner}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink />
                            </a>
                        </IconButton>
                    </div>
                    <p className="mt-6 whitespace-pre-line leading-relaxed">
                        {campaign.description}
                    </p>

                    <h2 className="mt-12 text-lg font-semibold">
                        Backers{" "}
                        <span className="text-muted-foreground">{backers}</span>
                    </h2>
                    {campaign.donators.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            No donations yet. Be the first.
                        </p>
                    ) : (
                        <ul className="mt-3 divide-y rounded-2xl border bg-card">
                            {campaign.donators
                                .map((donor, i) => ({
                                    donor,
                                    value: campaign.donations[i],
                                }))
                                .reverse()
                                .map(({ donor, value }, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center justify-between px-4 py-3 text-sm"
                                    >
                                        <span className="flex items-center gap-3">
                                            <AddressAvatar address={donor} />
                                            {donor.toLowerCase() ===
                                            address?.toLowerCase()
                                                ? "You"
                                                : shortAddress(donor)}
                                        </span>
                                        <span className="font-medium">
                                            {formatEth(value)} ETH
                                        </span>
                                    </li>
                                ))}
                        </ul>
                    )}
                </article>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <StatusPill status={status} />
                            {isOwner && status === "active" && (
                                <IconButton
                                    label="End campaign early"
                                    onClick={() => setIsConfirmOpen(true)}
                                >
                                    <Lock />
                                </IconButton>
                            )}
                        </div>
                        <p className="mt-5 text-4xl font-semibold tracking-tight">
                            {formatEth(campaign.amountCollected)}
                            <span className="text-xl text-muted-foreground">
                                {" "}
                                ETH
                            </span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            raised of {formatEth(campaign.target)} ETH goal
                        </p>
                        <Progress value={progress} className="mt-5 h-2" />
                        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                            <span>{progress}% funded</span>
                            <span>{timeLeft(campaign.deadline)}</span>
                        </div>

                        <div className="mt-6 border-t pt-6">
                            {status === "active" && (
                                <form onSubmit={handleDonate} className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            min="0.0001"
                                            step="any"
                                            max={ethers.utils.formatEther(remaining)}
                                            placeholder="0.05"
                                            required
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="h-12 pr-14 text-lg"
                                            aria-label="Donation amount in ETH"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                                            ETH
                                        </span>
                                    </div>
                                    <WithTooltip label="Send ETH to this campaign">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="h-12 w-full text-base"
                                            disabled={isDonating}
                                        >
                                            {isDonating
                                                ? "Sending…"
                                                : address
                                                  ? "Back this campaign"
                                                  : "Connect wallet to donate"}
                                        </Button>
                                    </WithTooltip>
                                    <p className="text-center text-xs text-muted-foreground">
                                        {formatEth(remaining)} ETH to go. Refunded
                                        if the goal isn&apos;t met.
                                    </p>
                                </form>
                            )}
                            {status === "funded" &&
                                (isOwner ? (
                                    <WithTooltip label="Close the campaign and send the funds to your wallet">
                                        <Button
                                            size="lg"
                                            className="h-12 w-full text-base"
                                            onClick={handleClose}
                                            disabled={isClosing}
                                        >
                                            {isClosing
                                                ? "Withdrawing…"
                                                : `Withdraw ${formatEth(campaign.amountCollected)} ETH`}
                                        </Button>
                                    </WithTooltip>
                                ) : (
                                    <Note>
                                        Goal reached! The creator can now
                                        withdraw the funds.
                                    </Note>
                                ))}
                            {status === "failed" &&
                                (myContribution.gt(0) ? (
                                    <WithTooltip label="Get your donation back">
                                        <Button
                                            size="lg"
                                            className="h-12 w-full text-base"
                                            onClick={handleRefund}
                                            disabled={isRefunding}
                                        >
                                            {isRefunding
                                                ? "Refunding…"
                                                : `Claim refund of ${formatEth(myContribution)} ETH`}
                                        </Button>
                                    </WithTooltip>
                                ) : (
                                    <Note>
                                        This campaign didn&apos;t reach its goal.
                                        Backers can claim a refund here.
                                    </Note>
                                ))}
                            {status === "closed" && (
                                <Note>
                                    Fully funded. The creator has withdrawn the
                                    funds.
                                </Note>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>End this campaign early?</DialogTitle>
                        <DialogDescription>
                            It hasn&apos;t reached its goal, so no funds will be
                            paid out and every backer will be able to claim a
                            refund. This can&apos;t be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <WithTooltip label="Close the campaign permanently">
                            <Button
                                variant="destructive"
                                onClick={handleClose}
                                disabled={isClosing}
                            >
                                {isClosing ? "Ending…" : "End campaign"}
                            </Button>
                        </WithTooltip>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Note({ children }: { children: React.ReactNode }) {
    return (
        <p className="rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
            {children}
        </p>
    );
}
