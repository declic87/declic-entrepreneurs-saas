"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoDProps {
  size?: number;
  className?: string;
}

export function LogoD({ size = 60, className }: LogoDProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dégradé orange → jaune */}
        <defs>
          <linearGradient id="d-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F39C12" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FDB913" />
          </linearGradient>
        </defs>

        {/* Lettre D avec dégradé */}
        <path
          d="M 25 15 H 55 C 75 15 85 30 85 50 C 85 70 75 85 55 85 H 25 V 15 Z M 35 25 V 75 H 55 C 68 75 75 65 75 50 C 75 35 68 25 55 25 H 35 Z"
          fill="url(#d-gradient)"
        />
      </svg>
    </div>
  );
}

export function LogoDRounded({ size = 80, className }: LogoDProps) {
  return (
    <div className={cn("relative", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cercle de fond avec dégradé */}
        <defs>
          <linearGradient id="circle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F39C12" />
            <stop offset="100%" stopColor="#FDB913" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="url(#circle-gradient)" />

        {/* D blanc au centre */}
        <path
          d="M 30 25 H 52 C 67 25 75 35 75 50 C 75 65 67 75 52 75 H 30 V 25 Z M 37 32 V 68 H 52 C 62 68 68 60 68 50 C 68 40 62 32 52 32 H 37 Z"
          fill="white"
        />
      </svg>
    </div>
  );
}