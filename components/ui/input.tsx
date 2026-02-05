"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string; // Petit texte d'aide en dessous
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-bold text-[#2C3E50] ml-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm transition-all duration-200 shadow-sm",
              "placeholder:text-gray-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67E22] focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              error && "border-red-500 focus-visible:ring-red-500 shadow-red-50/50",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>

        {error ? (
          <p className="mt-1.5 text-xs font-semibold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-gray-400 ml-1 font-medium">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };