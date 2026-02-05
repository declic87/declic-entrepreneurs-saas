"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card : Conteneur principal
 * On garde l'arrondi 2xl et l'effet de survol du code Vercel
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-gray-200 bg-white text-[#2C3E50] shadow-sm transition-all duration-300 hover:shadow-md",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-[#2C3E50]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/**
 * StatCard : Le composant "Star" de Vercel
 * Idéal pour afficher : "CA prévisionnel", "Économie d'impôts", etc.
 */
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, subtitle, icon, trend, trendValue, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-black text-[#2C3E50]">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                trend === "up" ? "bg-emerald-50 text-emerald-600" : 
                trend === "down" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
              )}>
                {trend === "up" && "↑"} {trend === "down" && "↓"} {trend === "neutral" && "→"} {trendValue}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-[#E67E22]/10 p-3 text-[#E67E22]">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
);
StatCard.displayName = "StatCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, StatCard };