"use client";

import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Every control gets a styled tooltip. Disabled buttons don't emit pointer
// events, so the trigger is a span wrapper that still receives hover.
export function WithTooltip({
    label,
    children,
}: {
    label: string;
    children: React.ReactElement;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className="inline-flex">{children}</span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

export const IconButton = React.forwardRef<
    HTMLButtonElement,
    ButtonProps & { label: string }
>(({ label, variant = "ghost", ...props }, ref) => (
    <WithTooltip label={label}>
        <Button
            ref={ref}
            size="icon"
            variant={variant}
            aria-label={label}
            {...props}
        />
    </WithTooltip>
));
IconButton.displayName = "IconButton";
