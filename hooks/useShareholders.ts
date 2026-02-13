// hooks/useShareholders.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Shareholder {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  nationality: string;
  address: string;
  shares_count: number;
  shares_percentage: number;
  apport_numeraire: number;
  apport_nature: string;
  apport_nature_valorisation: number;
  is_president: boolean;
  is_gerant: boolean;
  profession?: string;
  numero_ordre?: string;
}

export function useShareholders(userId: string) {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Charger les associés existants
  const loadShareholders = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('company_shareholders')
        .select('*')
        .eq('user_id', userId)
        .order('shares_percentage', { ascending: false });

      if (fetchError) throw fetchError;

      // Mapper les données pour garantir que id est présent
      const mappedData = (data || []).map(item => ({
        ...item,
        id: item.id || '', // Garantir que id n'est jamais undefined
      }));

      setShareholders(mappedData);
    } catch (err: any) {
      console.error('Erreur chargement associés:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder tous les associés (remplace tout)
  const saveShareholders = async (newShareholders: Shareholder[]) => {
    if (!userId) {
      setError('User ID requis');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Supprimer tous les associés existants
      const { error: deleteError } = await supabase
        .from('company_shareholders')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 2. Insérer les nouveaux associés
      const shareholdersToInsert = newShareholders.map((s) => ({
        user_id: userId,
        first_name: s.first_name,
        last_name: s.last_name,
        birth_date: s.birth_date,
        birth_place: s.birth_place,
        nationality: s.nationality,
        address: s.address,
        shares_count: s.shares_count,
        shares_percentage: s.shares_percentage,
        apport_numeraire: s.apport_numeraire,
        apport_nature: s.apport_nature || '',
        apport_nature_valorisation: s.apport_nature_valorisation || 0,
        is_president: s.is_president,
        is_gerant: s.is_gerant,
        profession: s.profession || null,
        numero_ordre: s.numero_ordre || null,
      }));

      const { error: insertError } = await supabase
        .from('company_shareholders')
        .insert(shareholdersToInsert);

      if (insertError) throw insertError;

      setShareholders(newShareholders);
      return true;
    } catch (err: any) {
      console.error('Erreur sauvegarde associés:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer tous les associés
  const clearShareholders = async () => {
    if (!userId) return false;

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('company_shareholders')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setShareholders([]);
      return true;
    } catch (err: any) {
      console.error('Erreur suppression associés:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    loadShareholders();
  }, [userId]);

  return {
    shareholders,
    loading,
    error,
    loadShareholders,
    saveShareholders,
    clearShareholders,
  };
}