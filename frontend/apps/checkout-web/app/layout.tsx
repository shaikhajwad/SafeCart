import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeCart – Secure F-Commerce Checkout",
  description:
    "SafeCart is a trusted checkout and escrow platform for Bangladesh F-commerce. Pay safely, track your order, and shop with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
