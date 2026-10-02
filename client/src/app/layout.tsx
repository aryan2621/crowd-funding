import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThirdWebProvider } from "./thirdweb";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "crowdfund",
    description:
        "Back ideas you believe in, straight from your wallet. Refunds if the goal isn't met.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <ThirdWebProvider>
                <body
                    className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
                >
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <TooltipProvider delayDuration={150}>
                            {children}
                            <Toaster />
                        </TooltipProvider>
                    </ThemeProvider>
                </body>
            </ThirdWebProvider>
        </html>
    );
}
