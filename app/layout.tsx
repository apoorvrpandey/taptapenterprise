import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   
    <html suppressHydrationWarning lang="en">
       
      <body className={`${inter.className} `}>

      <div className="h-full bg-[#D7D6D6]">
          <div className="h-[100px] md:pl-[4.75rem] fixed inset-y-0 w-full z-50">
            <Navbar/>
          </div>
          <div className="hidden md:flex h-full w-24 flex-col fixed inset-y-0 z-50">
          <Sidebar/>
          </div>
          <main className="md:pl-[4.75rem] pt-[60px] h-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
