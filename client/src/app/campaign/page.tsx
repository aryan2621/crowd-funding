"use client";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    useAddress,
    useContract,
    useContractRead,
    useContractWrite,
} from "@thirdweb-dev/react";
import { BigNumber, ethers } from "ethers";
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
import { Label } from "@/components/ui/label";
import CustomConnectWallet from "@/elements/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Calendar,
    Target,
    User,
    DollarSign,
    Users,
    Undo2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import BasicLayout from "@/layouts/BasicLayout";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Campaign,
    STATUS_LABELS,
    getCampaignStatus,
    getProgress,
} from "@/models/campaign";

// Campaign IDs only exist on-chain, so the page reads ?id= at runtime
// instead of using a dynamic route (which static export can't pre-render).
export default function Page() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <CampaignDetails />
        </Suspense>
    );
}

function CampaignDetails() {
    const { toast } = useToast();
    const key = useSearchParams().get("id") ?? "";
    const address = useAddress();
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

    const [donationAmount, setDonationAmount] = useState(0);

    if (isLoading)
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    if (!campaign)
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Campaign not found</AlertDescription>
            </Alert>
        );
    const { donators, donations } = campaign;
    const progress = getProgress(campaign);
    const status = getCampaignStatus(campaign);
    const remaining = Number(
        ethers.utils.formatEther(
            campaign.target.sub(campaign.amountCollected),
        ),
    );
    const canDonate = status === "active";
    const canRefund =
        status === "failed" && BigNumber.from(contribution ?? 0).gt(0);
    const daysLeft = Math.max(
        0,
        Math.ceil(
            (campaign.deadline.toNumber() * 1000 - Date.now()) /
                (1000 * 60 * 60 * 24),
        ),
    );

    const handleDonate = async () => {
        if (!address) {
            toast({
                title: "Please connect your wallet to donate.",
            });
            return;
        }
        try {
            await donateToCampaign({
                args: [key],
                overrides: {
                    value: ethers.utils.parseEther(donationAmount.toFixed(2)),
                },
            });
            toast({
                title: "Donation successful!",
            });
            setDonationAmount(0);
        } catch (error) {
            console.error("Error donating to campaign:", error);
            toast({
                title: "Error donating to campaign.",
                description: "Please try again.",
            });
        }
    };

    const handleRefund = async () => {
        try {
            await claimRefund({ args: [key] });
            toast({
                title: "Refund sent to your wallet.",
            });
        } catch (error) {
            console.error("Error claiming refund:", error);
            toast({
                title: "Error claiming refund.",
                description: "Please try again.",
            });
        }
    };

    return (
        <BasicLayout>
            <div className="container mx-auto p-4">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">{campaign.title}</h1>
                    <CustomConnectWallet />
                </header>

                <Card className="w-full max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            {campaign.title}
                            <Badge variant="secondary" className="ml-2">
                                #{Number(key) + 1}
                            </Badge>
                            <Badge variant="outline" className="ml-2">
                                {STATUS_LABELS[status]}
                            </Badge>
                        </CardTitle>
                        <CardDescription>{campaign.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <img
                            className="w-full h-[400px] object-cover rounded-md mb-4"
                            src={campaign.image}
                            alt={campaign.title}
                        />
                        <Progress value={progress} className="w-full mb-4" />
                        <div className="flex justify-between text-sm mb-4">
                            <Badge variant="outline" className="flex items-center">
                                <Target className="mr-1 h-4 w-4" />
                                {ethers.utils.formatEther(
                                    campaign.amountCollected,
                                )}{" "}
                                ETH raised
                            </Badge>
                            <Badge variant="outline" className="flex items-center">
                                <Target className="mr-1 h-4 w-4" />
                                {ethers.utils.formatEther(campaign.target)} ETH
                                goal
                            </Badge>
                        </div>
                        <div className="flex items-center mb-4">
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
                        {canDonate && (
                            <>
                                <div className="mb-4">
                                    <Label
                                        htmlFor="donationAmount"
                                        className="mb-2 block"
                                    >
                                        Donation Amount (ETH)
                                    </Label>
                                    <div className="flex items-center">
                                        <Slider
                                            id="donationAmount"
                                            max={remaining}
                                            step={0.01}
                                            value={[donationAmount]}
                                            onValueChange={(value) =>
                                                setDonationAmount(value[0])
                                            }
                                            className="flex-grow mr-4"
                                        />
                                        <Badge
                                            variant="secondary"
                                            className="text-lg"
                                        >
                                            {donationAmount.toFixed(2)} ETH
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleDonate}
                                    disabled={
                                        !address ||
                                        donationAmount === 0 ||
                                        isDonating
                                    }
                                    className="w-full"
                                >
                                    <DollarSign className="mr-2 h-4 w-4" />{" "}
                                    Donate
                                </Button>
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="justify-between">
                        <Badge variant="outline" className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {daysLeft} days left
                        </Badge>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                Deadline:{" "}
                                {new Date(
                                    campaign.deadline.toNumber() * 1000,
                                ).toLocaleDateString()}
                            </Badge>
                            {canRefund && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefund}
                                    disabled={isRefunding}
                                    title="Claim refund"
                                    aria-label="Claim refund"
                                >
                                    <Undo2 className="h-4 w-4" />
                                </Button>
                            )}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        title="View donors"
                                        aria-label="View donors"
                                    >
                                        <Users className="h-4 w-4" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right">
                                    <SheetHeader>
                                        <SheetTitle>Donors List</SheetTitle>
                                        <SheetDescription>
                                            List of donors and their
                                            contributions
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                                        {donators.length === 0 && (
                                            <p className="text-sm text-gray-500">
                                                No donations yet.
                                            </p>
                                        )}
                                        {donators.map(
                                            (donor: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded"
                                                >
                                                    <div className="flex items-center">
                                                        <Avatar className="h-8 w-8 mr-2">
                                                            <AvatarImage
                                                                src={`https://avatar.vercel.sh/${donor}`}
                                                            />
                                                            <AvatarFallback>
                                                                <User className="h-4 w-4" />
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">
                                                            {donor.slice(0, 6)}
                                                            ...
                                                            {donor.slice(-4)}
                                                        </span>
                                                    </div>
                                                    <Badge>
                                                        {ethers.utils.formatEther(
                                                            donations[index],
                                                        )}{" "}
                                                        ETH
                                                    </Badge>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <SheetFooter>
                                        <SheetClose asChild>
                                            <Button variant="outline">
                                                Close
                                            </Button>
                                        </SheetClose>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </BasicLayout>
    );
}
