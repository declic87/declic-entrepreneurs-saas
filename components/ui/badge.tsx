"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Couleur principale Déclic (Orange)
        default:
          "border-transparent bg-[#E67E22] text-white hover:bg-[#D35400]",
        // Couleur secondaire (Bleu sombre / Slate)
        secondary:
          "border-transparent bg-[#2C3E50] text-white hover:bg-[#1A252F]",
        // Actions critiques
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        // Succès / Payé / Validé
        success:
          "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
        // Attention / En attente
        warning:
          "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        // Style épuré
        outline: "text-[#2C3E50] border-gray-300",
        // Variantes douces pour les simulateurs (utilisées précédemment)
        hot: "border-transparent bg-red-100 text-red-700",
        warm: "border-transparent bg-amber-100 text-amber-700",
        cold: "border-transparent bg-blue-100 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };