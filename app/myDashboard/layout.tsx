import { Roboto } from "next/font/google";
import Script from 'next/script';
import { ReactNode } from 'react';
import { Metadata } from 'next';

// Define the props type for the DashboardLayout component
interface DashboardLayoutProps {
  children: ReactNode;
}

// Default export for the DashboardLayout component
export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <>
    
      {/* Other JSX code */}
      {children}
      {/* Other JSX code */}
    </>
  );
}

// Define the props type for the Page component

// Named export for the Page component

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "100", "300", "500", "700", "900"]
});

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "TapTap Enterprise Dashboard",
};