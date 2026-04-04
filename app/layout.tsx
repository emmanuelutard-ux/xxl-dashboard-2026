import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { RoleProvider } from "@/contexts/RoleContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "XXL Communication - Pilotage Média",
  description: "Plateforme de pilotage média pour les promoteurs immobiliers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={cn(inter.className, "h-screen bg-background")} suppressHydrationWarning={true}>
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
