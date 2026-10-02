"use client";
import React, { useState } from "react";
import {
    useAddress,
    useContract,
    useContractRead,
    useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, Target, User, Loader2 } from "lucide-react";
import Link from "next/link";
import {
    Campaign,
    CampaignForm,
    STATUS_LABELS,
    getCampaignStatus,
    getProgress,
} from "@/models/campaign";
import { Calendar } from "@/components/ui/calendar";
import CustomConnectWallet from "@/elements/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import BasicLayout from "@/layouts/BasicLayout";

interface CampaignCardProps {
    index: number;
    campaign: Campaign;
    onClose: () => void;
    isClosing: boolean;
}

const CampaignCard = ({
    campaign,
    onClose,
    index,
    isClosing,
}: CampaignCardProps) => {
    const address = useAddress();
    const progress = getProgress(campaign);
    const status = getCampaignStatus(campaign);
    return (
        <Card className="w-[350px]">
            <CardHeader className="relative">
                <CardTitle className="flex items-center">
                    <span>{campaign.title}</span>
                    <Badge variant="secondary" className="ml-2">
                        #{index + 1}
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                        {STATUS_LABELS[status]}
                    </Badge>
                </CardTitle>
                <CardDescription>{campaign.description}</CardDescription>
                {address === campaign.owner && !campaign.isClosed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={onClose}
                        disabled={isClosing}
                        title="Close campaign"
                        aria-label="Close campaign"
                    >
                        <Lock className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <img
                    className="w-full h-[200px] object-cover rounded-md"
                    src={campaign.image}
                    alt={campaign.title}
                />
                <Progress value={progress} className="w-full mt-4" />
                <Badge variant="outline" className="flex items-center my-2">
                    <Target className="mr-1 h-4 w-4" />
                    {ethers.utils.formatEther(campaign.amountCollected)} ETH
                    raised
                </Badge>
                <Badge variant="outline" className="flex items-center mb-1">
                    <Target className="mr-1 h-4 w-4" />
                    {ethers.utils.formatEther(campaign.target)} ETH goal
                </Badge>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                            src={`https://avatar.vercel.sh/${campaign.owner}`}
                        />
                        <AvatarFallback>
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-500">
                        by {campaign.owner.slice(0, 6)}...
                        {campaign.owner.slice(-4)}
                    </span>
                </div>
                <Link href={`/campaign?id=${index}`}>
                    <Button variant="outline">View Details</Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

interface CreateCampaignDialogProps {
    onCreateCampaign: (campaignData: CampaignForm) => Promise<void>;
    isCreating: boolean;
}

const CreateCampaignDialog = ({
    onCreateCampaign,
    isCreating,
}: CreateCampaignDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [campaignData, setCampaignData] = useState<CampaignForm>({
        title: "",
        description: "",
        target: 0,
        deadline: new Date(),
        image: "",
    });
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onCreateCampaign(campaignData);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={isCreating}>Create Campaign</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new fundraising
                        campaign.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-8">
                    <form onSubmit={handleSubmit} className="flex-1">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    className="col-span-3"
                                    required
                                    value={campaignData.title}
                                    onChange={(e) =>
                                        setCampaignData({
                                            ...campaignData,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="description"
                                    className="text-right"
                                >
                                    Description
                                </Label>
                                <Input
                                    id="description"
                                    name="description"
                                    className="col-span-3"
                                    required
                                    value={campaignData.description}
                                    onChange={(e) => {
                                        setCampaignData({
                                            ...campaignData,
                                            description: e.target.value,
                                        });
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="target" className="text-right">
                                    Target (ETH)
                                </Label>
                                <div className="col-span-3 flex items-center">
                                    <Slider
                                        id="target"
                                        name="target"
                                        min={0}
                                        max={10}
                                        step={0.1}
                                        className="flex-grow mr-2"
                                        value={[campaignData.target]}
                                        onValueChange={(value) => {
                                            setCampaignData({
                                                ...campaignData,
                                                target: value[0],
                                            });
                                        }}
                                    />
                                    <Badge variant="secondary">
                                        {campaignData.target} ETH
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="deadline"
                                    className="text-right"
                                >
                                    Deadline
                                </Label>
                                <div className="col-span-3 border rounded-lg">
                                    <Calendar
                                        mode="single"
                                        selected={campaignData.deadline}
                                        disabled={{ before: new Date() }}
                                        onSelect={(date) => {
                                            setCampaignData({
                                                ...campaignData,
                                                deadline: date ?? new Date(),
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="image" className="text-right">
                                    Image URL
                                </Label>
                                <Input
                                    id="image"
                                    name="image"
                                    type="url"
                                    className="col-span-3"
                                    required
                                    value={campaignData.image}
                                    onChange={(e) =>
                                        setCampaignData({
                                            ...campaignData,
                                            image: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isCreating}>
                                Create Campaign
                            </Button>
                        </DialogFooter>
                    </form>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {campaignData.image ? (
                            <img
                                src={campaignData.image}
                                alt="Campaign preview"
                                className="w-full h-full object-cover rounded-md"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                                No image provided
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
export default function Component() {
    const address = useAddress();
    const { toast } = useToast();
    const { contract } = useContract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS);
    const { data: campaigns, isLoading: isCampaignsLoading } = useContractRead(
        contract,
        "getCampaigns",
    );
    const { mutateAsync: createCampaign, isLoading: isCreating } =
        useContractWrite(contract, "createCampaign");
    const { mutateAsync: closeCampaign, isLoading: isClosing } =
        useContractWrite(contract, "closeCampaign");

    const handleCreateCampaign = async (campaignData: CampaignForm) => {
        if (!contract || !address) return;
        if (
            !campaignData.title ||
            !campaignData.description ||
            !campaignData.target ||
            !campaignData.deadline ||
            !campaignData.image
        ) {
            toast({
                title: "Error creating campaign",
                description: "Please fill in all fields.",
            });
            return;
        }
        // End of the selected day, so picking today still gives a future deadline.
        const deadline = new Date(campaignData.deadline);
        deadline.setHours(23, 59, 59, 0);
        const timestamp = Math.floor(deadline.getTime() / 1000);
        const args = [
            campaignData.title,
            campaignData.description,
            ethers.utils.parseEther(campaignData.target.toFixed(2)),
            timestamp,
            campaignData.image,
        ];

        try {
            await createCampaign({
                args,
            });
            toast({
                title: "Campaign created successfully!",
                description: "Your campaign has been created.",
            });
        } catch (error) {
            console.error("Error creating campaign:", error);
            toast({
                title: "Error creating campaign",
                description: "Please try again.",
            });
        }
    };

    const handleCloseCampaign = async (campaignId: number) => {
        if (!contract || !address) return;

        try {
            await closeCampaign({ args: [campaignId] });
            toast({
                title: "Campaign closed successfully!",
                description:
                    "If the target was reached, the funds were sent to your wallet.",
            });
        } catch (error) {
            console.error("Error closing campaign:", error);
            toast({
                title: "Error closing campaign",
                description: "Please try again.",
            });
        }
    };
    return (
        <BasicLayout>
            <div className="container mx-auto p-4">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
                    <div className="flex gap-4">
                        <CustomConnectWallet />
                        <CreateCampaignDialog
                            onCreateCampaign={handleCreateCampaign}
                            isCreating={isCreating}
                        />
                    </div>
                </header>
                {isCampaignsLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : campaigns && campaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.map((campaign: Campaign, index: number) => (
                            <CampaignCard
                                key={index}
                                index={index}
                                campaign={campaign}
                                onClose={() => handleCloseCampaign(index)}
                                isClosing={isClosing}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <p className="text-xl mb-4">
                            No campaigns found. Create one to get started!
                        </p>
                        <Button
                            onClick={() =>
                                document
                                    .querySelector<HTMLButtonElement>(
                                        '[aria-haspopup="dialog"]',
                                    )
                                    ?.click()
                            }
                        >
                            Create Your First Campaign
                        </Button>
                    </div>
                )}
            </div>
        </BasicLayout>
    );
}
