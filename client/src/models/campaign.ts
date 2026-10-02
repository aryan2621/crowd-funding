import { BigNumber } from "ethers";

// Shape returned by the contract; amounts are in wei, deadline in seconds.
export interface Campaign {
    owner: string;
    title: string;
    description: string;
    target: BigNumber;
    deadline: BigNumber;
    amountCollected: BigNumber;
    image: string;
    donators: string[];
    donations: BigNumber[];
    isClosed: boolean;
}

// Create-campaign form state; target is in ETH.
export interface CampaignForm {
    title: string;
    description: string;
    target: number;
    deadline: Date;
    image: string;
}

export type CampaignStatus = "active" | "funded" | "failed" | "closed";

export const STATUS_LABELS: Record<CampaignStatus, string> = {
    active: "Active",
    funded: "Funded",
    failed: "Failed",
    closed: "Paid out",
};

export function getCampaignStatus(campaign: Campaign): CampaignStatus {
    const reached = campaign.amountCollected.gte(campaign.target);
    const expired = campaign.deadline.toNumber() * 1000 < Date.now();
    if (campaign.isClosed) return reached ? "closed" : "failed";
    if (reached) return "funded";
    if (expired) return "failed";
    return "active";
}

export function getProgress(campaign: Campaign): number {
    if (campaign.target.isZero()) return 0;
    return Math.min(
        100,
        campaign.amountCollected.mul(100).div(campaign.target).toNumber(),
    );
}
