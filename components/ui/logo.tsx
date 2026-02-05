"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "light" | "dark";
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, text: "text-lg", sub: "text-[9px]" },
  md: { icon: 40, text: "text-xl", sub: "text-[10px]" },
  lg: { icon: 48, text: "text-2xl", sub: "text-[11px]" },
  xl: { icon: 56, text: "text-3xl", sub: "text-xs" },
};

export function Logo({
  size = "md",
  showText = true,
  variant = "light",
  className,
}: LogoProps) {
  const { icon, text, sub } = sizeMap[size];
  const isDark = variant === "dark";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon - Éclair avec dégradé Premium */}
      <div
        className="relative flex items-center justify-center rounded-xl shadow-lg shadow-orange-500/20"
        style={{
          width: icon,
          height: icon,
          background: "linear-gradient(135deg, #F39C12 0%, #E67E22 100%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: icon * 0.55, height: icon * 0.55 }}
        >
          <path
            d="M13 2L4.09344 12.6879C3.74463 13.1064 3.57023 13.3157 3.56756 13.4925C3.56524 13.6461 3.63372 13.7923 3.75324 13.8889C3.89073 14 4.16316 14 4.70802 14H12L11 22L19.9066 11.3121C20.2554 10.8936 20.4298 10.6843 20.4324 10.5075C20.4348 10.3539 20.3663 10.2077 20.2468 10.1111C20.1093 10 19.8368 10 19.292 10H12L13 2Z"
            fill="white"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Textes - Utilisation des couleurs exactes du SaaS */}
      {showText && (
        <div className="flex flex-col">
          <span
            className={cn(
              text,
              "font-black leading-none tracking-tighter italic", // Italic pour l'effet "vitesse/déclic"
              isDark ? "text-[#2C3E50]" : "text-white"
            )}
          >
            DÉCLIC
          </span>
          <span
            className={cn(
              sub,
              "font-bold tracking-[0.2em] uppercase mt-0.5",
              isDark ? "text-gray-400" : "text-white/60"
            )}
          >
            Entrepreneurs
          </span>
        </div>
      )}
    </div>
  );
}

// Version simplifiée pour la barre latérale ou favicon
export function LogoIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-xl", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #F39C12 0%, #E67E22 100%)",
      }}
    >
       <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
       </svg>
    </div>
  );
}