"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatEth, shortAddress, timeLeft } from "@/lib/format";
import {
    Campaign,
    CampaignStatus,
    STATUS_LABELS,
    getCampaignStatus,
    getProgress,
} from "@/models/campaign";
import { AddressAvatar } from "@/elements/wallet";

const STATUS_STYLES: Record<CampaignStatus, string> = {
    active: "bg-primary text-primary-foreground",
    funded: "bg-info text-white",
    failed: "bg-destructive text-destructive-foreground",
    closed: "bg-secondary text-secondary-foreground",
};

export function StatusPill({
    status,
    className,
}: {
    status: CampaignStatus;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                STATUS_STYLES[status],
                className,
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}

// User-supplied image URLs often break; fall back to a soft placeholder.
export function CampaignImage({
    src,
    alt,
    className,
}: {
    src: string;
    alt: string;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) {
        return (
            <div
                className={cn(
                    "grid place-items-center bg-gradient-to-br from-primary/20 via-secondary to-info/20 text-muted-foreground",
                    className,
                )}
            >
                <ImageOff className="h-6 w-6" />
            </div>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            onError={() => setFailed(true)}
            className={cn("object-cover", className)}
        />
    );
}

export function CampaignCard({
    campaign,
    id,
}: {
    campaign: Campaign;
    id: number;
}) {
    const status = getCampaignStatus(campaign);
    const progress = getProgress(campaign);
    return (
        <Link
            href={`/campaign?id=${id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="relative">
                <CampaignImage
                    src={campaign.image}
                    alt={campaign.title}
                    className="aspect-[16/10] w-full transition duration-500 group-hover:scale-[1.02]"
                />
                <StatusPill status={status} className="absolute left-3 top-3" />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
                <div>
                    <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">
                        {campaign.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {campaign.description}
                    </p>
                </div>
                <div className="mt-auto space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-baseline justify-between text-sm">
                        <span>
                            <span className="font-semibold">
                                {formatEth(campaign.amountCollected)} ETH
                            </span>
                            <span className="text-muted-foreground">
                                {" "}
                                of {formatEth(campaign.target)}
                            </span>
                        </span>
                        <span className="text-muted-foreground">
                            {timeLeft(campaign.deadline)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                    <AddressAvatar address={campaign.owner} className="h-5 w-5" />
                    by {shortAddress(campaign.owner)}
                </div>
            </div>
        </Link>
    );
}

export function CampaignCardSkeleton() {
    return (
        <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="aspect-[16/10] animate-pulse bg-muted" />
            <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded bg-muted" />
            </div>
        </div>
    );
}
