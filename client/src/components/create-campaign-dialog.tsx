"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WithTooltip } from "@/elements/with-tooltip";
import { CampaignImage } from "@/components/campaign-card";
import { CampaignForm } from "@/models/campaign";

const EMPTY_FORM: CampaignForm = {
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
};

export function CreateCampaignDialog({
    open,
    onOpenChange,
    onCreate,
    isCreating,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (form: CampaignForm) => Promise<boolean>;
    isCreating: boolean;
}) {
    const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
    const set =
        (key: keyof CampaignForm) =>
        (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        ) =>
            setForm({ ...form, [key]: e.target.value });

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (await onCreate(form)) {
            setForm(EMPTY_FORM);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Start a campaign</DialogTitle>
                    <DialogDescription>
                        If the goal isn&apos;t reached by the deadline, every
                        backer can claim a full refund.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-5 pt-2">
                    <CampaignImage
                        src={form.image}
                        alt="Cover preview"
                        className="aspect-[16/9] w-full rounded-xl"
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="image">Cover image URL</Label>
                        <Input
                            id="image"
                            type="url"
                            placeholder="https://…"
                            required
                            value={form.image}
                            onChange={set("image")}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            placeholder="What are you raising for?"
                            required
                            maxLength={80}
                            value={form.title}
                            onChange={set("title")}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Story</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell backers why this matters and how the funds will be used."
                            required
                            value={form.description}
                            onChange={set("description")}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="target">Goal (ETH)</Label>
                            <Input
                                id="target"
                                type="number"
                                inputMode="decimal"
                                min="0.001"
                                step="0.001"
                                placeholder="1.0"
                                required
                                value={form.target}
                                onChange={set("target")}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deadline">Deadline</Label>
                            <Input
                                id="deadline"
                                type="date"
                                min={format(new Date(), "yyyy-MM-dd")}
                                required
                                value={form.deadline}
                                onChange={set("deadline")}
                            />
                        </div>
                    </div>
                    <WithTooltip label="Publish this campaign on-chain">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={isCreating}
                        >
                            {isCreating ? "Creating…" : "Create campaign"}
                        </Button>
                    </WithTooltip>
                </form>
            </DialogContent>
        </Dialog>
    );
}
