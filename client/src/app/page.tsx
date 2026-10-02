"use client";
import React, { useMemo, useRef, useState } from "react";
import {
    useContract,
    useContractRead,
    useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { HandCoins, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
    CampaignCard,
    CampaignCardSkeleton,
} from "@/components/campaign-card";
import { CreateCampaignDialog } from "@/components/create-campaign-dialog";
import { WithTooltip } from "@/elements/with-tooltip";
import { useWallet } from "@/elements/wallet";
import { settle } from "@/lib/format";
import { Campaign, CampaignForm, getCampaignStatus } from "@/models/campaign";

const FILTERS = [
    { key: "all", label: "All", hint: "Show every campaign" },
    { key: "active", label: "Active", hint: "Campaigns still accepting funds" },
    { key: "ended", label: "Ended", hint: "Funded, failed or closed campaigns" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const STEPS = [
    {
        icon: Rocket,
        title: "Launch",
        body: "Set a goal and a deadline. Your campaign lives on-chain in seconds.",
    },
    {
        icon: HandCoins,
        title: "Get backed",
        body: "Anyone with a wallet can chip in ETH, and every donation is public.",
    },
    {
        icon: ShieldCheck,
        title: "Withdraw or refund",
        body: "Hit the goal and the funds are yours. Miss it and backers get refunded.",
    },
];

export default function Home() {
    const { toast } = useToast();
    const { address, connectWallet, ensureNetwork } = useWallet();
    const { contract } = useContract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
    const { data, isLoading } = useContractRead(contract, "getCampaigns");
    const { mutateAsync: createCampaign } = useContractWrite(
        contract,
        "createCampaign",
    );

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const dataRef = useRef<Campaign[]>([]);
    dataRef.current = (data as Campaign[] | undefined) ?? [];
    const [filter, setFilter] = useState<Filter>("all");

    // Keep each campaign's on-chain id, newest first.
    const campaigns = useMemo(() => {
        const list = ((data as Campaign[] | undefined) ?? []).map(
            (campaign, id) => ({ campaign, id }),
        );
        return list.reverse().filter(({ campaign }) => {
            if (filter === "all") return true;
            const isActive = getCampaignStatus(campaign) === "active";
            return filter === "active" ? isActive : !isActive;
        });
    }, [data, filter]);

    const openCreate = async () => {
        if (!address && !(await connectWallet())) return;
        setIsCreateOpen(true);
    };

    const handleCreate = async (form: CampaignForm) => {
        const deadline = new Date(`${form.deadline}T23:59:59`);
        const title = form.title.trim();
        const countBefore = dataRef.current.length;
        setIsCreating(true);
        try {
            await ensureNetwork();
            await settle(
                createCampaign({
                    args: [
                        title,
                        form.description.trim(),
                        ethers.utils.parseEther(form.target),
                        Math.floor(deadline.getTime() / 1000),
                        form.image.trim(),
                    ],
                }),
                () =>
                    dataRef.current
                        .slice(countBefore)
                        .some(
                            (c) =>
                                c.title === title &&
                                c.owner.toLowerCase() === address?.toLowerCase(),
                        ),
            );
            toast({
                title: "Campaign launched",
                description: "It's live and ready for backers.",
            });
            return true;
        } catch (error) {
            console.error("Error creating campaign:", error);
            toast({
                title: "Couldn't create campaign",
                description: "The transaction was rejected or failed.",
            });
            return false;
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <SiteHeader onCreate={openCreate} />
            <main className="flex-1">
                <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center md:pt-28">
                    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Live on the Sepolia testnet
                    </span>
                    <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                        Back ideas you believe in.{" "}
                        <span className="text-primary">
                            Straight from your wallet.
                        </span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
                        Launch a campaign in a minute. Creators get paid only
                        when the goal is met. Otherwise, everyone gets their
                        ETH back.
                    </p>
                    <div className="mt-8">
                        <WithTooltip label="Create a new fundraising campaign">
                            <Button
                                size="lg"
                                className="h-12 rounded-full px-8 text-base"
                                onClick={openCreate}
                            >
                                Start a campaign
                            </Button>
                        </WithTooltip>
                    </div>
                </section>

                <section id="campaigns" className="mx-auto max-w-6xl px-4 pb-20">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Campaigns
                        </h2>
                        <div className="flex rounded-full border bg-card p-1">
                            {FILTERS.map((f) => (
                                <WithTooltip key={f.key} label={f.hint}>
                                    <button
                                        onClick={() => setFilter(f.key)}
                                        className={cn(
                                            "rounded-full px-4 py-1.5 text-sm font-medium transition",
                                            filter === f.key
                                                ? "bg-foreground text-background"
                                                : "text-muted-foreground hover:text-foreground",
                                        )}
                                    >
                                        {f.label}
                                    </button>
                                </WithTooltip>
                            ))}
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                                <CampaignCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : campaigns.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {campaigns.map(({ campaign, id }) => (
                                <CampaignCard
                                    key={id}
                                    id={id}
                                    campaign={campaign}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
                            <p className="font-medium">
                                {filter === "all"
                                    ? "No campaigns yet"
                                    : `No ${filter} campaigns`}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Be the first to launch one.
                            </p>
                        </div>
                    )}
                </section>

                <section className="border-t bg-card/50">
                    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-3">
                        {STEPS.map(({ icon: Icon, title, body }, i) => (
                            <div key={title}>
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-4 font-semibold">
                                    {i + 1}. {title}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <SiteFooter />
            <CreateCampaignDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onCreate={handleCreate}
                isCreating={isCreating}
            />
        </div>
    );
}
