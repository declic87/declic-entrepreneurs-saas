'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, UserPlus, Phone, Mail, Calendar } from 'lucide-react';

export default function HOSLeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Données exemple - à remplacer par vraies données DB
  const leads = [
    {
      id: '1',
      name: 'Sophie Martin',
      email: 'sophie.martin@example.com',
      phone: '+33 6 12 34 56 78',
      status: 'Nouveau',
      source: 'LinkedIn',
      assigned_to: 'Thomas Dubois',
      created_at: '2026-02-18',
    },
    {
      id: '2',
      name: 'Lucas Bernard',
      email: 'lucas.bernard@example.com',
      phone: '+33 6 23 45 67 89',
      status: 'Qualifié',
      source: 'Site Web',
      assigned_to: 'Marie Lefebvre',
      created_at: '2026-02-17',
    },
  ];

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#123055]">Leads</h1>
          <p className="text-gray-600 mt-1">Gestion des leads de l'équipe</p>
        </div>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <UserPlus size={18} className="mr-2" />
          Nouveau Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Leads</p>
            <p className="text-3xl font-bold text-[#123055] mt-2">487</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Nouveaux (7j)</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">23</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Qualifiés</p>
            <p className="text-3xl font-bold text-green-600 mt-2">156</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Convertis</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">89</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un lead..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 ring-amber-500/20 outline-none"
          />
        </div>
        <Button variant="outline" className="border-gray-300">
          <Filter size={18} className="mr-2" />
          Filtres
        </Button>
      </div>

      {/* Liste des leads */}
      <div className="space-y-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{lead.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {lead.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      lead.status === 'Nouveau' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'Qualifié' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {lead.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Assigné à {lead.assigned_to}
                    </p>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Calendar size={14} className="mr-2" />
                    Programmer RDV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Aucun lead trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}