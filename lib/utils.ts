import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// --- UTILITAIRES UI (Version Cursor/Shadcn) ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- FORMATTAGE MÉTIER ---
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  if (!name) return "??";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// --- CALCULATEURS FISCAUX (Le coeur du simulateur) ---
export function calculateIR(revenuImposable: number, parts: number = 1): number {
  const tranches = [
    { min: 0, max: 11294, taux: 0 },
    { min: 11295, max: 28797, taux: 0.11 },
    { min: 28798, max: 82341, taux: 0.30 },
    { min: 82342, max: 177106, taux: 0.41 },
    { min: 177107, max: Infinity, taux: 0.45 },
  ];
  const quotient = revenuImposable / parts;
  let impot = 0;
  for (const tranche of tranches) {
    if (quotient > tranche.min) {
      const base = Math.min(quotient, tranche.max) - tranche.min;
      impot += base * tranche.taux;
    }
  }
  return Math.round(impot * parts);
}

export function calculateIS(benefice: number): number {
  if (benefice <= 0) return 0;
  if (benefice <= 42500) return Math.round(benefice * 0.15);
  return Math.round(42500 * 0.15 + (benefice - 42500) * 0.25);
}

export function calculateCotisationsMicro(ca: number, type: "BNC" | "BIC_SERVICES" | "BIC_VENTES"): number {
  const taux = { BNC: 0.211, BIC_SERVICES: 0.212, BIC_VENTES: 0.123 };
  return Math.round(ca * (taux[type] || 0.211));
}

// --- COULEURS DYNAMIQUES ---
export const statusColors: Record<string, string> = {
  NOUVEAU: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PERDU: "bg-red-100 text-red-700 border-red-200",
  // ... ajoute les autres au besoin
};