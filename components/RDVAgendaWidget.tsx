"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, Clock } from "lucide-react";

interface RDVAgendaItem {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'in_progress';
  hasReport?: boolean;
}

interface RDVAgendaWidgetProps {
  rdvs: RDVAgendaItem[];
}

export function RDVAgendaWidget({ rdvs }: RDVAgendaWidgetProps) {
  const router = useRouter();

  function handleCreateReport(rdv: RDVAgendaItem) {
    sessionStorage.setItem('rdv_client_id', rdv.clientId);
    sessionStorage.setItem('rdv_client_name', rdv.clientName);
    router.push('/expert/rdv-companion?autoselect=true');
  }

  return (
    <div className="space-y-3">
      {rdvs.map((rdv) => (
        <Card key={rdv.id} className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-slate-900">{rdv.clientName}</p>
                  {rdv.status === 'completed' && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      <CheckCircle2 size={12} className="mr-1" />
                      Terminé
                    </Badge>
                  )}
                  {rdv.status === 'in_progress' && (
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      <Clock size={12} className="mr-1" />
                      En cours
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {rdv.date} à {rdv.time}
                </p>
              </div>

              {(rdv.status === 'completed' || rdv.status === 'in_progress') && (
                <div className="flex items-center gap-2">
                  {rdv.hasReport ? (
                    <Badge className="bg-green-100 text-green-700">
                      Compte-rendu fait
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCreateReport(rdv)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Compte-rendu
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Version mini pour dashboard
export function QuickRDVList({ rdvs }: RDVAgendaWidgetProps) {
  const router = useRouter();

  const needsReport = rdvs.filter(
    rdv => (rdv.status === 'completed' || rdv.status === 'in_progress') && !rdv.hasReport
  );

  if (needsReport.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <CheckCircle2 className="mx-auto text-green-600 mb-2" size={32} />
          <p className="text-sm text-green-800 font-medium">
            Tous vos comptes-rendus sont à jour !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-slate-700 mb-3">
        ⚠️ {needsReport.length} compte(s)-rendu(s) en attente
      </p>
      {needsReport.slice(0, 3).map((rdv) => (
        <div
          key={rdv.id}
          className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div>
            <p className="text-sm font-medium text-slate-900">{rdv.clientName}</p>
            <p className="text-xs text-slate-600">{rdv.date}</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              sessionStorage.setItem('rdv_client_id', rdv.clientId);
              sessionStorage.setItem('rdv_client_name', rdv.clientName);
              router.push('/expert/rdv-companion?autoselect=true');
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}