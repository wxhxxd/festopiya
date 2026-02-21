import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Updated path to find navbar inside the (auth)/components folder
import Navbar from "./(auth)/components/navbar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Festopiya",
  description: "College Fest Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}