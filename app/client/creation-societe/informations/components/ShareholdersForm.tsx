'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';

export interface Shareholder {
  id: string;
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

interface ShareholdersFormProps {
  companyType: string;
  capitalAmount: number;
  shareholders: Shareholder[];
  onChange: (shareholders: Shareholder[]) => void;
  requiresProfession?: boolean;
}

export default function ShareholdersForm({
  companyType,
  capitalAmount,
  shareholders,
  onChange,
  requiresProfession = false,
}: ShareholdersFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Déterminer le type de dirigeant
  const isDirigeantPresident = ['SAS', 'SELAS', 'SELASU', 'SASU'].includes(companyType);
  const dirigeantLabel = isDirigeantPresident ? 'Président' : 'Gérant';
  const dirigeantField = isDirigeantPresident ? 'is_president' : 'is_gerant';

  // Générer un ID unique
  const generateId = () => `shareholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter un associé
  const addShareholder = () => {
    const newShareholder: Shareholder = {
      id: generateId(),
      first_name: '',
      last_name: '',
      birth_date: '',
      birth_place: '',
      nationality: 'Française',
      address: '',
      shares_count: 0,
      shares_percentage: 0,
      apport_numeraire: 0,
      apport_nature: '',
      apport_nature_valorisation: 0,
      is_president: false,
      is_gerant: false,
      profession: '',
      numero_ordre: '',
    };

    onChange([...shareholders, newShareholder]);
  };

  // Supprimer un associé
  const removeShareholder = (id: string) => {
    const updated = shareholders.filter((s) => s.id !== id);
    onChange(updated);
  };

  // Mettre à jour un associé
  const updateShareholder = (id: string, field: keyof Shareholder, value: any) => {
    const updated = shareholders.map((s) => {
      if (s.id === id) {
        const updatedShareholder = { ...s, [field]: value };

        // Si on change le nombre de parts, recalculer le pourcentage
        if (field === 'shares_count') {
          const totalShares = shareholders.reduce((sum, sh) => {
            if (sh.id === id) return sum + Number(value);
            return sum + sh.shares_count;
          }, 0);
          updatedShareholder.shares_percentage = totalShares > 0 ? (Number(value) / totalShares) * 100 : 0;
        }

        // Si on change le pourcentage, recalculer les parts
        if (field === 'shares_percentage') {
          const totalShares = shareholders.reduce((sum, sh) => sum + sh.shares_count, 0);
          updatedShareholder.shares_count = Math.round((Number(value) / 100) * totalShares);
        }

        // Si on coche président/gérant, décocher les autres
        if ((field === 'is_president' || field === 'is_gerant') && value === true) {
          return updatedShareholder;
        }

        return updatedShareholder;
      }

      // Décocher les autres si on vient de cocher celui-ci
      if ((field === 'is_president' && value === true) || (field === 'is_gerant' && value === true)) {
        return { ...s, [field]: false };
      }

      return s;
    });

    onChange(updated);
  };

  // Calculer le total des pourcentages
  const totalPercentage = shareholders.reduce((sum, s) => sum + Number(s.shares_percentage || 0), 0);

  // Calculer le total des apports
  const totalApports = shareholders.reduce(
    (sum, s) => sum + Number(s.apport_numeraire || 0) + Number(s.apport_nature_valorisation || 0),
    0
  );

  // Validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Vérifier qu'il y a au moins 2 associés
    if (shareholders.length < 2) {
      newErrors.count = 'Minimum 2 associés requis';
    }

    // Vérifier que le total des pourcentages = 100%
    if (Math.abs(totalPercentage - 100) > 0.01) {
      newErrors.percentage = `Total des pourcentages : ${totalPercentage.toFixed(2)}% (doit être 100%)`;
    }

    // Vérifier qu'il y a un président/gérant
    const hasDirigeant = shareholders.some((s) => s[dirigeantField]);
    if (!hasDirigeant) {
      newErrors.dirigeant = `Vous devez désigner un ${dirigeantLabel}`;
    }

    // Vérifier le total des apports
    if (capitalAmount > 0 && Math.abs(totalApports - capitalAmount) > 0.01) {
      newErrors.capital = `Total des apports : ${totalApports.toFixed(2)}€ (doit être ${capitalAmount}€)`;
    }

    setErrors(newErrors);
  }, [shareholders, totalPercentage, totalApports, capitalAmount, dirigeantField, dirigeantLabel]);

  // Vérifier si le formulaire est valide
  const isValid = Object.keys(errors).length === 0 && shareholders.length >= 2;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle>Associés / Actionnaires</CardTitle>
          <CardDescription>
            Votre {companyType} nécessite au minimum 2 associés. Ajoutez les informations de chaque associé
            ci-dessous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">Capital social</div>
              <div className="text-2xl font-bold text-orange-600">{capitalAmount.toFixed(2)}€</div>
            </div>
            <div>
              <div className="font-medium">Total des pourcentages</div>
              <div
                className={`text-2xl font-bold ${
                  Math.abs(totalPercentage - 100) > 0.01 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {totalPercentage.toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="font-medium">Total des apports</div>
              <div
                className={`text-2xl font-bold ${
                  Math.abs(totalApports - capitalAmount) > 0.01 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {totalApports.toFixed(2)}€
              </div>
            </div>
          </div>

          {/* Erreurs globales */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1 space-y-1">
                  {Object.entries(errors).map(([key, message]) => (
                    <div key={key} className="text-sm text-red-700">
                      • {message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des associés */}
      {shareholders.map((shareholder, index) => (
        <Card key={shareholder.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Associé {index + 1}
                {shareholder[dirigeantField] && (
                  <span className="ml-2 text-sm font-normal text-orange-600">({dirigeantLabel})</span>
                )}
              </CardTitle>
              {shareholders.length > 2 && (
                <Button variant="ghost" size="sm" onClick={() => removeShareholder(shareholder.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Identité */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={shareholder.first_name}
                  onChange={(e) => updateShareholder(shareholder.id, 'first_name', e.target.value)}
                  placeholder="Jean"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={shareholder.last_name}
                  onChange={(e) => updateShareholder(shareholder.id, 'last_name', e.target.value)}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de naissance *</Label>
                <Input
                  type="date"
                  value={shareholder.birth_date}
                  onChange={(e) => updateShareholder(shareholder.id, 'birth_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Lieu de naissance *</Label>
                <Input
                  value={shareholder.birth_place}
                  onChange={(e) => updateShareholder(shareholder.id, 'birth_place', e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nationalité *</Label>
                <Input
                  value={shareholder.nationality}
                  onChange={(e) => updateShareholder(shareholder.id, 'nationality', e.target.value)}
                  placeholder="Française"
                />
              </div>
              {requiresProfession && (
                <div>
                  <Label>Numéro d'ordre *</Label>
                  <Input
                    value={shareholder.numero_ordre}
                    onChange={(e) => updateShareholder(shareholder.id, 'numero_ordre', e.target.value)}
                    placeholder="Ex: 12345"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Adresse complète *</Label>
              <Textarea
                value={shareholder.address}
                onChange={(e) => updateShareholder(shareholder.id, 'address', e.target.value)}
                placeholder="10 rue de la République, 75001 Paris"
                rows={2}
              />
            </div>

            {/* Capital */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nombre de parts/actions *</Label>
                <Input
                  type="number"
                  min="0"
                  value={shareholder.shares_count}
                  onChange={(e) => updateShareholder(shareholder.id, 'shares_count', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Pourcentage (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={shareholder.shares_percentage}
                  onChange={(e) =>
                    updateShareholder(shareholder.id, 'shares_percentage', Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label>Apport numéraire (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shareholder.apport_numeraire}
                  onChange={(e) => updateShareholder(shareholder.id, 'apport_numeraire', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Apport en nature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Apport en nature (optionnel)</Label>
                <Input
                  value={shareholder.apport_nature}
                  onChange={(e) => updateShareholder(shareholder.id, 'apport_nature', e.target.value)}
                  placeholder="Ex: Matériel informatique"
                />
              </div>
              <div>
                <Label>Valorisation (€)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shareholder.apport_nature_valorisation}
                  onChange={(e) =>
                    updateShareholder(shareholder.id, 'apport_nature_valorisation', Number(e.target.value))
                  }
                />
              </div>
            </div>

            {/* Rôle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`dirigeant-${shareholder.id}`}
                checked={shareholder[dirigeantField]}
                onCheckedChange={(checked) =>
                  updateShareholder(shareholder.id, dirigeantField, checked === true)
                }
              />
              <label
                htmlFor={`dirigeant-${shareholder.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Désigner comme {dirigeantLabel}
              </label>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Bouton ajouter associé */}
      <Button type="button" variant="outline" onClick={addShareholder} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" />
        Ajouter un associé
      </Button>

      {/* Message de validation */}
      {isValid && shareholders.length >= 2 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center text-white">
              ✓
            </div>
            <span>Formulaire des associés complet et valide</span>
          </div>
        </div>
      )}
    </div>
  );
}