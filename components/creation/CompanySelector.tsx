'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Company {
  id: string;
  company_name: string;
  legal_form: string;
  is_active: boolean;
  current_step: number;
}

export default function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      const { data, error } = await supabase
        .from('user_companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCompanies(data || []);
      const active = data?.find((c: Company) => c.is_active);
      setActiveCompany(active || null);
    } catch (error) {
      console.error('Erreur chargement sociétés:', error);
    } finally {
      setLoading(false);
    }
  }

  async function switchCompany(companyId: string) {
    try {
      // Désactiver toutes les sociétés
      await supabase
        .from('user_companies')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Activer la société sélectionnée
      await supabase
        .from('user_companies')
        .update({ is_active: true })
        .eq('id', companyId);

      await loadCompanies();
    } catch (error) {
      console.error('Erreur changement société:', error);
    }
  }

  async function createNewCompany() {
    try {
      const { data, error } = await supabase.rpc('create_user_company', {
        p_company_name: `Nouvelle Société ${companies.length + 1}`,
        p_legal_form: 'SASU'
      });

      if (error) throw error;
      
      await switchCompany(data);
      window.location.href = '/client/creation-societe';
    } catch (error) {
      console.error('Erreur création société:', error);
    }
  }

  if (loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 size={16} />
          {activeCompany?.company_name || 'Sélectionner une société'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Mes sociétés</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className="flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{company.company_name}</p>
              <p className="text-xs text-slate-500">{company.legal_form}</p>
            </div>
            {company.is_active && <Check size={16} className="text-emerald-600" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={createNewCompany} className="text-indigo-600">
          <Plus size={16} className="mr-2" />
          Créer une nouvelle société
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}