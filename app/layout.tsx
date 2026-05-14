import type { Metadata } from "next";
import { Inter, Battambang, Kantumruy_Pro } from "next/font/google";
import "./globals.css";

// Load Fonts
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const battambang = Battambang({ weight: ['400', '700'], subsets: ["khmer"], variable: '--font-battambang' });
const kantumruy = Kantumruy_Pro({ weight: ['300', '400', '500', '600', '700'], subsets: ["khmer"], variable: '--font-kantumruy' });

export const metadata: Metadata = {
  title: "Grade 12 Math Quiz",
  description: "Khmer Math Quiz Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  return (
    <html lang="km" suppressHydrationWarning>
      <body className={`${inter.variable} ${battambang.variable} ${kantumruy.variable} font-sans bg-[#ffffff] text-[#222222] antialiased`}>
        {children}
      </body>
    </html>
  );
}