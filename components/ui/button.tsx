"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Principal - Orange Déclic Entrepreneurs
        default:
          "bg-[#E67E22] text-white hover:bg-[#D35400] shadow-md hover:shadow-lg hover:-translate-y-0.5",
        
        // Secondaire - Bleu Sombre Professionnel
        secondary:
          "bg-[#2C3E50] text-white hover:bg-[#1A252F] hover:-translate-y-0.5 shadow-sm",
        
        // Outline Orange
        outline:
          "border-2 border-[#E67E22] text-[#E67E22] bg-transparent hover:bg-[#E67E22] hover:text-white",
        
        // Outline Bleu
        "outline-primary":
          "border-2 border-[#2C3E50] text-[#2C3E50] bg-transparent hover:bg-[#2C3E50] hover:text-white",
          
        // Outline pour fond sombre
        "outline-light":
          "border-2 border-white/50 text-white bg-transparent hover:bg-white/10 hover:border-white",
        
        destructive:
          "bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5",
        
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-[#2C3E50]",
        
        link: "text-[#E67E22] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-12 px-6 py-3",
        xl: "h-14 px-8 py-4 text-base", // Le bouton "Appel à l'action" par excellence
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };