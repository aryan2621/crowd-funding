"use client";
import React, { useMemo, useRef, useState } from "react";
import {
    useContract,
    useContractRead,
    useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { CampaignCard, CampaignCardSkeleton } from "@/components/campaign-card";
import { CreateCampaignDialog } from "@/components/create-campaign-dialog";
import { WithTooltip } from "@/elements/with-tooltip";
import { useWallet } from "@/elements/wallet";
import { settle } from "@/lib/format";
import { Campaign, CampaignForm, getCampaignStatus } from "@/models/campaign";

const FILTERS = [
    { key: "all", label: "All", hint: "Show every campaign" },
    { key: "active", label: "Active", hint: "Campaigns still accepting funds" },
    {
        key: "ended",
        label: "Ended",
        hint: "Funded, failed or closed campaigns",
    },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

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

    // Filters only help when there's a mix of active and ended campaigns.
    const showFilters = useMemo(() => {
        const all = (data as Campaign[] | undefined) ?? [];
        const active = all.filter(
            (c) => getCampaignStatus(c) === "active",
        ).length;
        return active > 0 && active < all.length;
    }, [data]);

    // Keep each campaign's on-chain id, newest first.
    const campaigns = useMemo(() => {
        const list = ((data as Campaign[] | undefined) ?? []).map(
            (campaign, id) => ({ campaign, id }),
        );
        return list.reverse().filter(({ campaign }) => {
            if (filter === "all" || !showFilters) return true;
            const isActive = getCampaignStatus(campaign) === "active";
            return filter === "active" ? isActive : !isActive;
        });
    }, [data, filter, showFilters]);

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
                                c.owner.toLowerCase() ===
                                    address?.toLowerCase(),
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
            <SiteHeader />
            <main className="flex-1">
                <section className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center md:pt-24">
                    <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                        Back ideas you believe in.{" "}
                        <span className="text-primary">
                            Straight from your wallet.
                        </span>
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
                        Creators get paid only if the goal is met. Otherwise,
                        everyone gets their ETH back.
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

                <section
                    id="campaigns"
                    className="mx-auto max-w-6xl px-4 pb-20"
                >
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-2xl font-semibold tracking-tight">
                            Campaigns
                        </h2>
                        {showFilters && (
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
                        )}
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
