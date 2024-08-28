"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItemProps {
  src: string;
  label: string;
  href: string;
}

export const SidebarItem = ({ src, label, href }: SidebarItemProps) => {
  const pathname = usePathname();

  // Determine if the current link is active
  const isActive =
    (pathname === "/" && href === "/") ||
    pathname === href ||
    pathname?.startsWith(`${href}/`);

  // Inline styles for the active and inactive states
  const linkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    width: '70%',
    justifyContent: 'center',
    borderRadius: '8px',
    gap: '2px',
    textDecoration: 'none',
    color: isActive ? 'black' : 'white',
    backgroundColor: isActive ? '#88EB4C' : 'transparent',
    fontSize: '0.65rem',
    fontWeight: 500,
    transition: 'all 0.3s',
    padding: '8px',
  };

  const imgStyle: React.CSSProperties = {
    width: '18px', // Adjust the width as needed
    height: '18px', // Adjust the height as needed
  };

  const textStyle: React.CSSProperties = {
    textAlign: 'center',
  };

  return (
    <Link href={href} style={linkStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
        <img src={src} alt={label} style={imgStyle} />
        <p style={textStyle}>{label}</p>
      </div>
    </Link>
  );
};
