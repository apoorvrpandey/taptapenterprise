"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

interface TabsProps {
  company: string;
}

export default function Tabs({ company }: TabsProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview"; // Default to 'overview' if tab is null

  const routes = [
    {
      mainpath: `/company?company=${company}`,
      label: "Overview",
      path: "overview",
    },
    {
      mainpath: `/company?company=${company}&tab=jobs`,
      label: "Jobs",
      path: "jobs",
    },

    {
      mainpath: `/company?company=${company}&tab=benefits`,
      label: "Benefits",
      path: "benefits",
    },
    {
      mainpath: `/company?company=${company}&tab=people`,
      label: "People",
      path: "people",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        borderBottom: "1px solid #e0e0e0",
        paddingBottom: "10px",
      }}
    >
      {routes.map((route) => {
        const isActive = tab === route.path; // Check if the current tab matches the route path
        return (
          <Link
            key={route.path}
            href={route.mainpath}
            style={{
              color: isActive ? "#7F2FE4" : "#555",
              fontWeight: isActive ? 700 : 500,
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              borderBottom: `2px solid ${isActive ? "#7F2FE4" : "transparent"}`,
              transition: "color 0.3s, border-bottom-color 0.3s",
              outline: "none",
            }}
          >
            {route.label}
          </Link>
        );
      })}
    </div>
  );
}
