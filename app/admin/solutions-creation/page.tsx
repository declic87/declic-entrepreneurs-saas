'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Solution {
  id: string;
  name: string;
  slug: string;
  description: string;
  badge: string;
  icon: string;
  price: string;
  loom_video_url: string;
  cta_text: string;
  cta_link: string;
  order_index: number;
  features: { id: string; feature_text: string; order_index: number }[];
  benefits: { id: string; benefit_text: string; order_index: number }[];
}

export default function SolutionsCreationAdmin() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSolutions();
  }, []);

  async function loadSolutions() {
    const { data: sols } = await supabase
      .from('creation_solutions')
      .select('*')
      .order('order_index');

    if (sols) {
      const enriched = await Promise.all(
        sols.map(async (sol) => {
          const { data: features } = await supabase
            .from('creation_solution_features')
            .select('*')
            .eq('solution_id', sol.id)
            .order('order_index');

          const { data: benefits } = await supabase
            .from('creation_solution_benefits')
            .select('*')
            .eq('solution_id', sol.id)
            .order('order_index');

          return { ...sol, features: features || [], benefits: benefits || [] };
        })
      );
      setSolutions(enriched);
    }
    setLoading(false);
  }

  function startEdit(solution: Solution) {
    setEditingId(solution.id);
    setEditData({
      ...solution,
      features_text: solution.features.map(f => f.feature_text).join('\n'),
      benefits_text: solution.benefits.map(b => b.benefit_text).join('\n'),
    });
  }

  async function saveSolution() {
    try {
      const { error } = await supabase
        .from('creation_solutions')
        .update({
          name: editData.name,
          description: editData.description,
          price: editData.price,
          loom_video_url: editData.loom_video_url,
          cta_text: editData.cta_text,
          cta_link: editData.cta_link,
        })
        .eq('id', editingId);

      if (error) throw error;

      // Update features
      await supabase
        .from('creation_solution_features')
        .delete()
        .eq('solution_id', editingId);

      const features = editData.features_text.split('\n').filter((f: string) => f.trim());
      await supabase.from('creation_solution_features').insert(
        features.map((f: string, idx: number) => ({
          solution_id: editingId,
          feature_text: f.trim(),
          order_index: idx,
        }))
      );

      // Update benefits
      await supabase
        .from('creation_solution_benefits')
        .delete()
        .eq('solution_id', editingId);

      const benefits = editData.benefits_text.split('\n').filter((b: string) => b.trim());
      await supabase.from('creation_solution_benefits').insert(
        benefits.map((b: string, idx: number) => ({
          solution_id: editingId,
          benefit_text: b.trim(),
          order_index: idx,
        }))
      );

      toast.success('Solution mise à jour !');
      setEditingId(null);
      loadSolutions();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">🏢 Solutions de Création</h1>
        <p className="text-slate-600 mt-2">
          Gérer les options de création de société affichées aux clients
        </p>
      </div>

      <div className="grid gap-6">
        {solutions.map((sol) => (
          <Card key={sol.id} className="border-2">
            {editingId === sol.id ? (
              <CardContent className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Prix</Label>
                    <Input
                      value={editData.price}
                      onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>URL Vidéo Loom (embed)</Label>
                  <Input
                    placeholder="https://www.loom.com/share/..."
                    value={editData.loom_video_url}
                    onChange={(e) => setEditData({ ...editData, loom_video_url: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Texte bouton CTA</Label>
                    <Input
                      value={editData.cta_text}
                      onChange={(e) => setEditData({ ...editData, cta_text: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Lien CTA</Label>
                    <Input
                      value={editData.cta_link}
                      onChange={(e) => setEditData({ ...editData, cta_link: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Caractéristiques (une par ligne)</Label>
                  <Textarea
                    rows={5}
                    value={editData.features_text}
                    onChange={(e) => setEditData({ ...editData, features_text: e.target.value })}
                    placeholder="Compte pro immédiat&#10;Carte bancaire incluse"
                  />
                </div>

                <div>
                  <Label>Avantages Partenaire (une par ligne)</Label>
                  <Textarea
                    rows={3}
                    value={editData.benefits_text}
                    onChange={(e) => setEditData({ ...editData, benefits_text: e.target.value })}
                    placeholder="💰 2 mois offerts&#10;🎁 Carte premium gratuite"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveSolution} className="bg-green-600">
                    <Save className="mr-2" size={16} />
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">
                      {sol.icon} {sol.name}
                    </h3>
                    <p className="text-slate-600 mb-2">{sol.description}</p>
                    <p className="font-bold text-lg mb-4">{sol.price}</p>

                    <div className="mb-4">
                      <p className="font-semibold mb-2">Caractéristiques:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {sol.features.map((f) => (
                          <li key={f.id}>{f.feature_text}</li>
                        ))}
                      </ul>
                    </div>

                    {sol.benefits.length > 0 && (
                      <div>
                        <p className="font-semibold mb-2">Avantages:</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {sol.benefits.map((b) => (
                            <li key={b.id}>{b.benefit_text}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4 text-sm text-slate-600">
                      <p>
                        <strong>CTA:</strong> {sol.cta_text}
                      </p>
                      <p>
                        <strong>Lien:</strong> {sol.cta_link}
                      </p>
                      {sol.loom_video_url && (
                        <p>
                          <strong>Vidéo:</strong> ✅ Configurée
                        </p>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => startEdit(sol)}>
                    <Edit size={16} />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}