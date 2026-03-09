"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Play } from "lucide-react";

interface StartRDVButtonProps {
  clientId: string;
  clientName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export function StartRDVButton({ 
  clientId, 
  clientName,
  variant = 'default',
  size = 'default',
  fullWidth = false
}: StartRDVButtonProps) {
  const router = useRouter();

  function handleStartRDV() {
    // Stocker temporairement le client sélectionné
    sessionStorage.setItem('rdv_client_id', clientId);
    sessionStorage.setItem('rdv_client_name', clientName);
    
    // Rediriger vers l'outil RDV
    router.push('/expert/rdv-companion?autoselect=true');
  }

  return (
    <Button
      onClick={handleStartRDV}
      variant={variant}
      size={size}
      className={fullWidth ? 'w-full' : ''}
    >
      <Play className="mr-2 h-4 w-4" />
      Démarrer un RDV
    </Button>
  );
}

// Version card pour dashboard
interface RDVCardProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  lastRDV?: string;
  nextRDVNumber?: number;
}

export function QuickRDVCard({ 
  clientId, 
  clientName, 
  clientEmail,
  lastRDV,
  nextRDVNumber = 1
}: RDVCardProps) {
  const router = useRouter();

  function handleStartRDV() {
    sessionStorage.setItem('rdv_client_id', clientId);
    sessionStorage.setItem('rdv_client_name', clientName);
    router.push('/expert/rdv-companion?autoselect=true');
  }

  return (
    <div className="border-2 border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-slate-900">{clientName}</p>
          <p className="text-xs text-slate-600">{clientEmail}</p>
        </div>
        {lastRDV && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Dernier RDV : {lastRDV}
          </span>
        )}
      </div>
      
      <Button 
        onClick={handleStartRDV}
        size="sm"
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Play className="mr-2 h-4 w-4" />
        RDV #{nextRDVNumber}
      </Button>
    </div>
  );
}