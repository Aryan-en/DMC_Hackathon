'use client';

import React from 'react';

interface OntoraLogoProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function OntoraLogo({ size = 40, className = '', color = 'var(--accent-gold)', ...props }: OntoraLogoProps & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Main O-Ring with Trunk Gap */}
      <path 
        d="M45.5 88.5C26 86.5 11 70 11 50C11 28.5 28.5 11 50 11C71.5 11 89 28.5 89 50C89 70 74 86.5 54.5 88.5" 
        stroke={color} 
        strokeWidth="7" 
        strokeLinecap="round"
      />
      
      {/* Central Trunk */}
      <path 
        d="M50 89.5V45.5" 
        stroke={color} 
        strokeWidth="7" 
        strokeLinecap="round"
      />

      {/* Strategic Branches - Symmetrically Organic */}
      
      {/* Top Split */}
      <path d="M50 45.5L38 31" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M50 45.5L62 31" stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      
      {/* Mid Left Branch */}
      <path d="M50 58.5L28 44" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M38 49.5L34 56.5" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      
      {/* Mid Right Branch */}
      <path d="M50 58.5L72 44" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <path d="M62 49.5L66 56.5" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
      
      {/* Upper Split Branches */}
      <path d="M42 36L44 26" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M58 36L56 26" stroke={color} strokeWidth="4" strokeLinecap="round" />
      
      {/* Top crown tips */}
      <path d="M50 24V17" stroke={color} strokeWidth="4" strokeLinecap="round" />
      
    </svg>
  );
}
