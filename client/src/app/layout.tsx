import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThirdWebProvider } from "./thirdweb";
import { Toaster } from "@/components/ui/toaster";

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
    title: "Crowdsource",
    description: "Raise your funds with the power of the crowd",
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
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                    <main>
                        {children}
                        <Toaster />
                    </main>
                </body>
            </ThirdWebProvider>
        </html>
    );
}
