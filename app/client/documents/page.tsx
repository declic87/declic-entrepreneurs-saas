'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#123055] mb-8">Mes Documents</h1>

      {/* Documents auto-générés */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6">Documents générés automatiquement</h2>

          <div className="space-y-3">
            {[
              { name: 'Mise à disposition de l\'habitat', format: 'Word', date: '08/02/2026' },
              { name: 'Tableau des indemnités kilométriques', format: 'Excel', date: '08/02/2026' },
              { name: 'Attestation de vente de matériel', format: 'PDF', date: '01/02/2026' },
              { name: 'Récapitulatif frais professionnels', format: 'PDF', date: '01/02/2026' }
            ].map((doc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-amber-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{doc.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar size={14} />
                      Généré le {doc.date}
                    </p>
                  </div>
                </div>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Download size={16} className="mr-2" />
                  {doc.format}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents uploadés */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6">Mes documents uploadés</h2>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center">
            <FileText className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-slate-600 mb-4">Déposez vos documents ici</p>
            <Button variant="outline">Parcourir les fichiers</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}